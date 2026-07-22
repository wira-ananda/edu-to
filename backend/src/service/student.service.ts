import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { selectQuestionByWrs } from "../lib/wrs.js";
import {
  getRandomAvailableLevel,
  updateLevelAfterAnswer,
} from "../lib/tryout-level.js";
import { getTryoutQuestionWhere } from "../lib/access-control.js";
import type {
  AnswerOption,
  DifficultyLevel,
  EnrollmentStatus,
} from "../types/domain.js";
import type {
  AnswerQuestionInput,
  StartTryoutInput,
} from "../schema/student.schema.js";

export class StudentServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const levels: DifficultyLevel[] = ["LOW", "MEDIUM", "HIGH"];

const studentQuestionSelect = {
  id: true,
  questionText: true,
  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,
  imageUrl: true,
  imageAltText: true,
  difficultyLevel: true,
  weight: true,
} as const satisfies Prisma.QuestionSelect;

const answerQuestionSelect = {
  ...studentQuestionSelect,
  correctAnswer: true,
} as const satisfies Prisma.QuestionSelect;

const tryoutOwnerSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const satisfies Prisma.UserSelect;

const enrollmentSelect = {
  id: true,
  status: true,
  requestedAt: true,
  approvedAt: true,
  rejectedAt: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.TryoutEnrollmentSelect;

const sessionWithTryoutInclude = {
  tryout: {
    include: {
      subject: true,
    },
  },
} as const satisfies Prisma.TryoutSessionInclude;

const resultSessionInclude = {
  tryout: {
    include: {
      subject: true,
    },
  },
  answers: {
    select: {
      id: true,
      selectedAnswer: true,
      isCorrect: true,
      answeredAt: true,
      question: {
        select: {
          questionText: true,
          correctAnswer: true,
          imageUrl: true,
          imageAltText: true,
        },
      },
    },
    orderBy: {
      answeredAt: "asc",
    },
  },
  wrsLogs: {
    select: {
      id: true,
      currentLevel: true,
      candidateCount: true,
      totalWeight: true,
      randomValue: true,
      selectedQuestionWeight: true,
      selectedQuestionDifficulty: true,
      createdAt: true,
      question: {
        select: {
          questionText: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  },
} as const satisfies Prisma.TryoutSessionInclude;

type StudentQuestionCandidate = Prisma.QuestionGetPayload<{
  select: typeof studentQuestionSelect;
}>;

type SessionWithTryout = Prisma.TryoutSessionGetPayload<{
  include: typeof sessionWithTryoutInclude;
}>;

type ResultSessionRecord = Prisma.TryoutSessionGetPayload<{
  include: typeof resultSessionInclude;
}>;

type StudentEnrollmentPayload = Prisma.TryoutEnrollmentGetPayload<{
  select: typeof enrollmentSelect;
}>;

function calculateScore(correctCount: number, totalQuestions: number) {
  if (totalQuestions <= 0) {
    return 0;
  }

  return Math.round((correctCount / totalQuestions) * 100);
}

function toStudentQuestion(question: StudentQuestionCandidate) {
  return {
    id: question.id,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    imageUrl: question.imageUrl,
    imageAltText: question.imageAltText,
    difficultyLevel: question.difficultyLevel,
  };
}

function toEnrollmentPayload(enrollment: StudentEnrollmentPayload | null) {
  if (!enrollment) {
    return null;
  }

  return {
    id: enrollment.id,
    status: enrollment.status as EnrollmentStatus,
    requestedAt: enrollment.requestedAt,
    approvedAt: enrollment.approvedAt,
    rejectedAt: enrollment.rejectedAt,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
  };
}

function getEndsAt(startedAt: Date, durationMinutes: number) {
  return new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
}

function isExpired(startedAt: Date, durationMinutes: number) {
  return Date.now() >= getEndsAt(startedAt, durationMinutes).getTime();
}

function getSessionTimerPayload(
  session: SessionWithTryout,
  answeredCount: number,
) {
  const endsAt = getEndsAt(session.startedAt, session.tryout.durationMinutes);

  return {
    id: session.id,
    attemptNumber: session.attemptNumber,
    initialLevel: session.initialLevel,
    currentLevel: session.currentLevel,
    totalQuestions: session.totalQuestions,
    answeredCount,
    correctCount: session.correctCount,
    wrongCount: session.wrongCount,
    startedAt: session.startedAt,
    durationMinutes: session.tryout.durationMinutes,
    endsAt,
    serverNow: new Date(),
  };
}

function getQuestionWhereForSession(session: SessionWithTryout) {
  return getTryoutQuestionWhere({
    subjectId: session.tryout.subjectId,
    ownerId: session.tryout.ownerId,
  });
}

async function assertApprovedEnrollment(userId: string, tryoutId: string) {
  const enrollment = await prisma.tryoutEnrollment.findUnique({
    where: {
      tryoutId_studentId: {
        tryoutId,
        studentId: userId,
      },
    },
  });

  if (!enrollment) {
    throw new StudentServiceError(
      "Kamu belum terdaftar sebagai peserta tryout ini.",
      403,
    );
  }

  if (enrollment.status !== "APPROVED") {
    throw new StudentServiceError(
      "Kamu belum disetujui sebagai peserta tryout ini.",
      403,
    );
  }

  return enrollment;
}

async function finishSessionByTimeout(sessionId: string, userId: string) {
  const session = await prisma.tryoutSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: sessionWithTryoutInclude,
  });

  if (!session) {
    return null;
  }

  if (session.status === "FINISHED") {
    return session;
  }

  const existingAnswers = await prisma.answers.findMany({
    where: {
      sessionId: session.id,
    },
    select: {
      questionId: true,
      isCorrect: true,
    },
  });

  const answeredQuestionIds = new Set(
    existingAnswers.map((answer) => answer.questionId),
  );

  let currentLevel = session.currentLevel as DifficultyLevel;
  let answeredCount = existingAnswers.length;

  while (answeredCount < session.totalQuestions) {
    const pendingLog = await prisma.wrsLog.findFirst({
      where: {
        sessionId: session.id,
        questionId: {
          notIn: Array.from(answeredQuestionIds),
        },
      },
      select: {
        questionId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (pendingLog && !answeredQuestionIds.has(pendingLog.questionId)) {
      await prisma.answers.create({
        data: {
          sessionId: session.id,
          questionId: pendingLog.questionId,
          selectedAnswer: null,
          isCorrect: false,
        },
      });

      answeredQuestionIds.add(pendingLog.questionId);
      answeredCount += 1;
      currentLevel = updateLevelAfterAnswer(currentLevel, false);

      continue;
    }

    let candidates = await prisma.question.findMany({
      where: {
        ...getQuestionWhereForSession(session),
        difficultyLevel: currentLevel,
        id: {
          notIn: Array.from(answeredQuestionIds),
        },
      },
      select: studentQuestionSelect,
      orderBy: {
        createdAt: "asc",
      },
    });

    let usedLevel = currentLevel;

    if (candidates.length === 0) {
      for (const level of levels) {
        if (level === currentLevel) {
          continue;
        }

        const fallbackCandidates = await prisma.question.findMany({
          where: {
            ...getQuestionWhereForSession(session),
            difficultyLevel: level,
            id: {
              notIn: Array.from(answeredQuestionIds),
            },
          },
          select: studentQuestionSelect,
          orderBy: {
            createdAt: "asc",
          },
        });

        if (fallbackCandidates.length > 0) {
          candidates = fallbackCandidates;
          usedLevel = level;

          break;
        }
      }
    }

    if (candidates.length === 0) {
      break;
    }

    const selection = selectQuestionByWrs(candidates) as {
      selected: StudentQuestionCandidate;
      totalWeight: number;
      randomValue: number;
    };

    await prisma.wrsLog.create({
      data: {
        sessionId: session.id,
        questionId: selection.selected.id,
        currentLevel: usedLevel,
        candidateCount: candidates.length,
        totalWeight: selection.totalWeight,
        randomValue: selection.randomValue,
        selectedQuestionWeight: selection.selected.weight,
        selectedQuestionDifficulty: selection.selected.difficultyLevel,
      },
    });

    await prisma.answers.create({
      data: {
        sessionId: session.id,
        questionId: selection.selected.id,
        selectedAnswer: null,
        isCorrect: false,
      },
    });

    answeredQuestionIds.add(selection.selected.id);
    answeredCount += 1;
    currentLevel = updateLevelAfterAnswer(usedLevel, false);
  }

  const correctCount = await prisma.answers.count({
    where: {
      sessionId: session.id,
      isCorrect: true,
    },
  });

  const wrongCount = Math.max(0, session.totalQuestions - correctCount);
  const score = calculateScore(correctCount, session.totalQuestions);

  return prisma.tryoutSession.update({
    where: {
      id: session.id,
    },
    data: {
      currentLevel,
      correctCount,
      wrongCount,
      score,
      status: "FINISHED",
      finishedAt: new Date(),
    },
    include: sessionWithTryoutInclude,
  });
}

async function finishSessionNormally(sessionId: string) {
  const session = await prisma.tryoutSession.findUnique({
    where: {
      id: sessionId,
    },
    include: sessionWithTryoutInclude,
  });

  if (!session) {
    return null;
  }

  const correctCount = await prisma.answers.count({
    where: {
      sessionId: session.id,
      isCorrect: true,
    },
  });

  const answeredCount = await prisma.answers.count({
    where: {
      sessionId: session.id,
    },
  });

  const wrongCount = Math.max(0, answeredCount - correctCount);
  const score = calculateScore(correctCount, session.totalQuestions);

  return prisma.tryoutSession.update({
    where: {
      id: session.id,
    },
    data: {
      correctCount,
      wrongCount,
      score,
      status: "FINISHED",
      finishedAt: new Date(),
    },
    include: sessionWithTryoutInclude,
  });
}

async function getTryouts(userId: string) {
  const tryouts = await prisma.tryout.findMany({
    where: {
      status: "OPEN",
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
        },
      },
      owner: {
        select: tryoutOwnerSelect,
      },
      enrollments: {
        where: {
          studentId: userId,
        },
        select: enrollmentSelect,
        take: 1,
      },
      sessions: {
        where: {
          userId,
        },
        select: {
          id: true,
          status: true,
          attemptNumber: true,
          startedAt: true,
          finishedAt: true,
        },
        orderBy: {
          attemptNumber: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const mappedTryouts = await Promise.all(
    tryouts.map(async (tryout) => {
      const attemptsUsed = tryout.sessions.length;

      const ongoingSession =
        tryout.sessions.find(
          (session) =>
            session.status === "ONGOING" &&
            !isExpired(session.startedAt, tryout.durationMinutes),
        ) ?? null;

      const attemptsRemaining =
        tryout.maxAttempts === null
          ? null
          : Math.max(0, tryout.maxAttempts - attemptsUsed);

      const enrollment = tryout.enrollments[0] ?? null;
      const enrollmentStatus = enrollment?.status ?? null;
      const isApproved = enrollmentStatus === "APPROVED";

      const totalAvailableQuestions = await prisma.question.count({
        where: getTryoutQuestionWhere({
          subjectId: tryout.subjectId,
          ownerId: tryout.ownerId,
        }),
      });

      const attemptLimitAvailable =
        tryout.maxAttempts === null || attemptsUsed < tryout.maxAttempts;

      const canStart = isApproved && !ongoingSession && attemptLimitAvailable;
      const canContinue = isApproved && Boolean(ongoingSession);
      const canRequestJoin = !enrollment;

      return {
        id: tryout.id,
        title: tryout.title,
        totalQuestions: tryout.totalQuestions,
        durationMinutes: tryout.durationMinutes,
        maxAttempts: tryout.maxAttempts,
        status: tryout.status,
        attemptsUsed,
        attemptsRemaining,
        canStart,
        canContinue,
        canRequestJoin,
        ongoingSessionId: ongoingSession?.id ?? null,
        enrollmentStatus,
        enrollment: toEnrollmentPayload(enrollment),
        createdAt: tryout.createdAt,
        updatedAt: tryout.updatedAt,
        owner: tryout.owner
          ? {
              id: tryout.owner.id,
              name: tryout.owner.name,
              email: tryout.owner.email,
              role: tryout.owner.role,
            }
          : null,
        bank: {
          id: tryout.subject.id,
          name: tryout.subject.name,
          totalAvailableQuestions,
        },
      };
    }),
  );

  return {
    tryouts: mappedTryouts,
  };
}

async function requestJoinTryout(userId: string, tryoutId: string) {
  const tryout = await prisma.tryout.findUnique({
    where: {
      id: tryoutId,
    },
    include: {
      owner: {
        select: tryoutOwnerSelect,
      },
      subject: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!tryout) {
    throw new StudentServiceError("Tryout tidak ditemukan", 404);
  }

  if (tryout.status !== "OPEN") {
    throw new StudentServiceError(
      "Tryout ini belum dibuka atau sudah ditutup.",
      400,
    );
  }

  const existingEnrollment = await prisma.tryoutEnrollment.findUnique({
    where: {
      tryoutId_studentId: {
        tryoutId: tryout.id,
        studentId: userId,
      },
    },
    select: enrollmentSelect,
  });

  if (existingEnrollment?.status === "APPROVED") {
    return {
      message: "Kamu sudah terdaftar sebagai peserta tryout ini.",
      enrollment: toEnrollmentPayload(existingEnrollment),
      tryout: {
        id: tryout.id,
        title: tryout.title,
        owner: tryout.owner,
        bank: tryout.subject,
      },
    };
  }

  if (existingEnrollment?.status === "PENDING") {
    return {
      message: "Permintaan gabung tryout ini masih menunggu persetujuan.",
      enrollment: toEnrollmentPayload(existingEnrollment),
      tryout: {
        id: tryout.id,
        title: tryout.title,
        owner: tryout.owner,
        bank: tryout.subject,
      },
    };
  }

  if (existingEnrollment?.status === "REJECTED") {
    throw new StudentServiceError(
      "Permintaan gabung tryout ini sudah ditolak.",
      409,
    );
  }

  const enrollment = await prisma.tryoutEnrollment.create({
    data: {
      tryoutId: tryout.id,
      studentId: userId,
      status: "PENDING",
    },
    select: enrollmentSelect,
  });

  return {
    message: "Permintaan gabung tryout berhasil dikirim.",
    enrollment: toEnrollmentPayload(enrollment),
    tryout: {
      id: tryout.id,
      title: tryout.title,
      owner: tryout.owner,
      bank: tryout.subject,
    },
  };
}

async function startTryout(userId: string, input: StartTryoutInput) {
  const tryout = await prisma.tryout.findUnique({
    where: {
      id: input.tryoutId,
    },
    include: {
      subject: true,
    },
  });

  if (!tryout) {
    throw new StudentServiceError("Tryout tidak ditemukan", 404);
  }

  if (tryout.status !== "OPEN") {
    throw new StudentServiceError(
      "Tryout ini belum dibuka atau sudah ditutup.",
      400,
    );
  }

  await assertApprovedEnrollment(userId, tryout.id);

  const existingSessions = await prisma.tryoutSession.findMany({
    where: {
      userId,
      tryoutId: tryout.id,
    },
    orderBy: {
      attemptNumber: "desc",
    },
  });

  const ongoingSession = existingSessions.find(
    (session) => session.status === "ONGOING",
  );

  if (ongoingSession) {
    const fullOngoingSession = await prisma.tryoutSession.findUnique({
      where: {
        id: ongoingSession.id,
      },
      include: sessionWithTryoutInclude,
    });

    if (
      fullOngoingSession &&
      !isExpired(
        fullOngoingSession.startedAt,
        fullOngoingSession.tryout.durationMinutes,
      )
    ) {
      return {
        created: false,
        message: "Masih ada sesi tryout yang sedang berjalan.",
        session: fullOngoingSession,
      };
    }

    if (fullOngoingSession) {
      await finishSessionByTimeout(fullOngoingSession.id, userId);
    }
  }

  const refreshedSessions = await prisma.tryoutSession.findMany({
    where: {
      userId,
      tryoutId: tryout.id,
    },
    orderBy: {
      attemptNumber: "desc",
    },
  });

  if (
    tryout.maxAttempts !== null &&
    refreshedSessions.length >= tryout.maxAttempts
  ) {
    throw new StudentServiceError(
      `Tryout ini hanya dapat dikerjakan maksimal ${tryout.maxAttempts} kali.`,
      400,
    );
  }

  const questionWhere = getTryoutQuestionWhere({
    subjectId: tryout.subjectId,
    ownerId: tryout.ownerId,
  });

  const totalAvailableQuestions = await prisma.question.count({
    where: questionWhere,
  });

  if (totalAvailableQuestions === 0) {
    throw new StudentServiceError(
      "Bank soal pada tryout ini belum memiliki soal",
      400,
    );
  }

  if (tryout.totalQuestions > totalAvailableQuestions) {
    throw new StudentServiceError(
      `Jumlah soal tryout (${tryout.totalQuestions}) melebihi jumlah soal tersedia (${totalAvailableQuestions})`,
      400,
    );
  }

  const levelCounts = await prisma.question.groupBy({
    by: ["difficultyLevel"],
    where: questionWhere,
    _count: {
      _all: true,
    },
  });

  const availableLevels = levelCounts
    .filter((item) => item._count._all > 0)
    .map((item) => item.difficultyLevel as DifficultyLevel)
    .filter((level) => levels.includes(level));

  if (availableLevels.length === 0) {
    throw new StudentServiceError(
      "Tidak ada tingkat kesulitan soal yang tersedia.",
      400,
    );
  }

  const initialLevel = getRandomAvailableLevel(availableLevels);

  const latestAttemptNumber = refreshedSessions[0]?.attemptNumber ?? 0;
  const attemptNumber = latestAttemptNumber + 1;

  const session = await prisma.tryoutSession.create({
    data: {
      userId,
      tryoutId: tryout.id,
      attemptNumber,
      initialLevel,
      currentLevel: initialLevel,
      totalQuestions: tryout.totalQuestions,
    },
    include: sessionWithTryoutInclude,
  });

  return {
    created: true,
    message: "Sesi tryout berhasil dibuat",
    session,
  };
}

async function getSessions(userId: string) {
  const sessions = await prisma.tryoutSession.findMany({
    where: {
      userId,
    },
    include: {
      tryout: {
        include: {
          subject: true,
          owner: {
            select: tryoutOwnerSelect,
          },
        },
      },
      _count: {
        select: {
          answers: true,
        },
      },
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  return {
    sessions,
  };
}

async function getNextQuestion(userId: string, sessionId: string) {
  let session = await prisma.tryoutSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: sessionWithTryoutInclude,
  });

  if (!session) {
    throw new StudentServiceError("Sesi tryout tidak ditemukan", 404);
  }

  if (session.status === "FINISHED") {
    return {
      finished: true,
      message: "Sesi tryout sudah selesai",
    };
  }

  if (isExpired(session.startedAt, session.tryout.durationMinutes)) {
    await finishSessionByTimeout(session.id, userId);

    return {
      finished: true,
      message: "Waktu tryout habis",
    };
  }

  const answers = await prisma.answers.findMany({
    where: {
      sessionId,
    },
    select: {
      questionId: true,
    },
  });

  const answeredQuestionIds = answers.map((answer) => answer.questionId);

  if (answeredQuestionIds.length >= session.totalQuestions) {
    await finishSessionNormally(session.id);

    return {
      finished: true,
      message: "Tryout selesai",
    };
  }

  const pendingLog = await prisma.wrsLog.findFirst({
    where: {
      sessionId,
      questionId: {
        notIn: answeredQuestionIds,
      },
    },
    select: {
      questionId: true,
      question: {
        select: studentQuestionSelect,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (pendingLog) {
    return {
      finished: false,
      session: getSessionTimerPayload(session, answeredQuestionIds.length),
      question: toStudentQuestion(pendingLog.question),
    };
  }

  let candidates = await prisma.question.findMany({
    where: {
      ...getQuestionWhereForSession(session),
      difficultyLevel: session.currentLevel,
      id: {
        notIn: answeredQuestionIds,
      },
    },
    select: studentQuestionSelect,
    orderBy: {
      createdAt: "asc",
    },
  });

  let usedLevel = session.currentLevel as DifficultyLevel;

  if (candidates.length === 0) {
    for (const level of levels) {
      if (level === session.currentLevel) {
        continue;
      }

      const fallbackCandidates = await prisma.question.findMany({
        where: {
          ...getQuestionWhereForSession(session),
          difficultyLevel: level,
          id: {
            notIn: answeredQuestionIds,
          },
        },
        select: studentQuestionSelect,
        orderBy: {
          createdAt: "asc",
        },
      });

      if (fallbackCandidates.length > 0) {
        candidates = fallbackCandidates;
        usedLevel = level;

        break;
      }
    }
  }

  if (candidates.length === 0) {
    await finishSessionNormally(session.id);

    return {
      finished: true,
      message: "Semua kandidat soal sudah habis",
    };
  }

  if (usedLevel !== session.currentLevel) {
    session = await prisma.tryoutSession.update({
      where: {
        id: session.id,
      },
      data: {
        currentLevel: usedLevel,
      },
      include: sessionWithTryoutInclude,
    });
  }

  const selection = selectQuestionByWrs(candidates) as {
    selected: StudentQuestionCandidate;
    totalWeight: number;
    randomValue: number;
  };

  await prisma.wrsLog.create({
    data: {
      sessionId: session.id,
      questionId: selection.selected.id,
      currentLevel: usedLevel,
      candidateCount: candidates.length,
      totalWeight: selection.totalWeight,
      randomValue: selection.randomValue,
      selectedQuestionWeight: selection.selected.weight,
      selectedQuestionDifficulty: selection.selected.difficultyLevel,
    },
  });

  return {
    finished: false,
    session: getSessionTimerPayload(session, answeredQuestionIds.length),
    question: toStudentQuestion(selection.selected),
  };
}

async function answerQuestion(
  userId: string,
  sessionId: string,
  input: AnswerQuestionInput,
) {
  const session = await prisma.tryoutSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: sessionWithTryoutInclude,
  });

  if (!session) {
    throw new StudentServiceError("Sesi tryout tidak ditemukan", 404);
  }

  if (session.status === "FINISHED") {
    return {
      message: "Sesi tryout sudah selesai",
      finished: true,
      session,
    };
  }

  if (isExpired(session.startedAt, session.tryout.durationMinutes)) {
    const updatedSession = await finishSessionByTimeout(session.id, userId);

    return {
      message: "Waktu tryout habis",
      finished: true,
      session: updatedSession,
    };
  }

  const question = await prisma.question.findFirst({
    where: {
      ...getQuestionWhereForSession(session),
      id: input.questionId,
    },
    select: answerQuestionSelect,
  });

  if (!question) {
    throw new StudentServiceError("Soal tidak valid untuk sesi ini", 400);
  }

  const selectedLog = await prisma.wrsLog.findFirst({
    where: {
      sessionId: session.id,
      questionId: question.id,
    },
    select: {
      id: true,
    },
  });

  if (!selectedLog) {
    throw new StudentServiceError(
      "Soal ini tidak berasal dari proses pemilihan WRS sesi ini",
      400,
    );
  }

  const existingAnswer = await prisma.answers.findUnique({
    where: {
      sessionId_questionId: {
        sessionId: session.id,
        questionId: question.id,
      },
    },
    select: {
      id: true,
    },
  });

  if (existingAnswer) {
    throw new StudentServiceError("Soal ini sudah dijawab", 400);
  }

  const selectedAnswer = input.selectedAnswer as AnswerOption;
  const isCorrect = selectedAnswer === question.correctAnswer;

  const nextLevel = updateLevelAfterAnswer(
    session.currentLevel as DifficultyLevel,
    isCorrect,
  );

  const answeredCount = await prisma.answers.count({
    where: {
      sessionId: session.id,
    },
  });

  const nextAnsweredCount = answeredCount + 1;
  const nextCorrectCount = session.correctCount + (isCorrect ? 1 : 0);
  const nextWrongCount = session.wrongCount + (isCorrect ? 0 : 1);
  const nextScore = calculateScore(nextCorrectCount, session.totalQuestions);
  const isFinished = nextAnsweredCount >= session.totalQuestions;

  const [, updatedSession] = await prisma.$transaction([
    prisma.answers.create({
      data: {
        sessionId: session.id,
        questionId: question.id,
        selectedAnswer,
        isCorrect,
      },
    }),
    prisma.tryoutSession.update({
      where: {
        id: session.id,
      },
      data: {
        currentLevel: nextLevel,
        correctCount: nextCorrectCount,
        wrongCount: nextWrongCount,
        score: nextScore,
        status: isFinished ? "FINISHED" : "ONGOING",
        finishedAt: isFinished ? new Date() : null,
      },
      include: sessionWithTryoutInclude,
    }),
  ]);

  return {
    message: "Jawaban berhasil disimpan",
    isCorrect,
    selectedAnswer,
    previousLevel: session.currentLevel,
    currentLevel: nextLevel,
    finished: isFinished,
    session: updatedSession,
  };
}

async function timeoutSession(userId: string, sessionId: string) {
  const session = await prisma.tryoutSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: sessionWithTryoutInclude,
  });

  if (!session) {
    throw new StudentServiceError("Sesi tryout tidak ditemukan", 404);
  }

  if (session.status === "FINISHED") {
    return {
      message: "Sesi tryout sudah selesai",
      finished: true,
      session,
    };
  }

  if (!isExpired(session.startedAt, session.tryout.durationMinutes)) {
    throw new StudentServiceError("Waktu tryout belum habis", 400);
  }

  const updatedSession = await finishSessionByTimeout(session.id, userId);

  return {
    message: "Waktu tryout habis. Soal yang belum dijawab dihitung salah.",
    finished: true,
    session: updatedSession,
  };
}

async function getSessionResult(userId: string, sessionId: string) {
  const session: ResultSessionRecord | null =
    await prisma.tryoutSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
      include: resultSessionInclude,
    });

  if (!session) {
    throw new StudentServiceError("Hasil tryout tidak ditemukan", 404);
  }

  return {
    session: {
      id: session.id,
      attemptNumber: session.attemptNumber,
      tryoutTitle: session.tryout.title,
      bankName: session.tryout.subject.name,
      initialLevel: session.initialLevel,
      currentLevel: session.currentLevel,
      totalQuestions: session.totalQuestions,
      score: session.score,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      status: session.status,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
    },
    answers: session.answers.map((answer) => ({
      id: answer.id,
      questionText: answer.question.questionText,
      imageUrl: answer.question.imageUrl,
      imageAltText: answer.question.imageAltText,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: answer.question.correctAnswer,
      isCorrect: answer.isCorrect,
      answeredAt: answer.answeredAt,
    })),
    wrsLogs: session.wrsLogs.map((log) => ({
      id: log.id,
      currentLevel: log.currentLevel,
      candidateCount: log.candidateCount,
      totalWeight: log.totalWeight,
      randomValue: log.randomValue,
      selectedQuestionWeight: log.selectedQuestionWeight,
      selectedQuestionDifficulty: log.selectedQuestionDifficulty,
      questionText: log.question.questionText,
      createdAt: log.createdAt,
    })),
  };
}

export default {
  getTryouts,
  requestJoinTryout,
  startTryout,
  getSessions,
  getNextQuestion,
  answerQuestion,
  timeoutSession,
  getSessionResult,
};

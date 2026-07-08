import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/auth.js";
import { roleMiddleware } from "../middlewares/role.js";
import { selectQuestionByWrs } from "../lib/wrs.js";
import {
  getRandomAvailableLevel,
  updateLevelAfterAnswer,
} from "../lib/tryout-level.js";
import type { AppEnv } from "../types/hono.js";
import type { AnswerOption, DifficultyLevel } from "../types/domain.js";

export const studentRoutes = new Hono<AppEnv>();

studentRoutes.use("*", authMiddleware, roleMiddleware(["STUDENT"]));

const levels: DifficultyLevel[] = ["LOW", "MEDIUM", "HIGH"];

type QuestionIdRecord = {
  questionId: string;
};

type AnswerQuestionRecord = {
  questionId: string;
  isCorrect?: boolean;
};

type StudentQuestionCandidate = {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficultyLevel: DifficultyLevel;
  weight: number;
};

type StudentTryoutRecord = {
  id: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
  subject: {
    id: string;
    name: string;
    _count: {
      questions: number;
    };
  };
};

type SessionWithTryout = {
  id: string;
  userId: string;
  tryoutId: string;
  initialLevel: DifficultyLevel;
  currentLevel: DifficultyLevel;
  totalQuestions: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  status: "ONGOING" | "FINISHED" | string;
  startedAt: Date;
  finishedAt: Date | null;
  tryout: {
    id: string;
    subjectId: string;
    title: string;
    durationMinutes: number;
    subject: {
      id: string;
      name: string;
    };
  };
};

type ResultAnswerRecord = {
  id: string;
  selectedAnswer: AnswerOption | null;
  isCorrect: boolean;
  answeredAt: Date;
  question: {
    questionText: string;
    correctAnswer: AnswerOption;
  };
};

type ResultWrsLogRecord = {
  id: string;
  currentLevel: DifficultyLevel;
  candidateCount: number;
  totalWeight: number;
  randomValue: number;
  selectedQuestionWeight: number;
  selectedQuestionDifficulty: DifficultyLevel;
  createdAt: Date;
  question: {
    questionText: string;
  };
};

type ResultSessionRecord = SessionWithTryout & {
  answers: ResultAnswerRecord[];
  wrsLogs: ResultWrsLogRecord[];
};

function calculateScore(correctCount: number, totalQuestions: number) {
  if (totalQuestions <= 0) return 0;
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
    difficultyLevel: question.difficultyLevel,
  };
}

function getEndsAt(startedAt: Date, durationMinutes: number) {
  return new Date(startedAt.getTime() + durationMinutes * 60 * 1000);
}

function isExpired(startedAt: Date, durationMinutes: number) {
  return Date.now() >= getEndsAt(startedAt, durationMinutes).getTime();
}

function getSessionTimerPayload(
  session: {
    id: string;
    initialLevel: DifficultyLevel;
    currentLevel: DifficultyLevel;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    startedAt: Date;
    tryout: {
      durationMinutes: number;
    };
  },
  answeredCount: number,
) {
  const endsAt = getEndsAt(session.startedAt, session.tryout.durationMinutes);

  return {
    id: session.id,
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

async function finishSessionByTimeout(sessionId: string, userId: string) {
  const session = (await prisma.tryoutSession.findFirst({
    where: {
      id: sessionId,
      userId,
    },
    include: {
      tryout: {
        include: {
          subject: true,
        },
      },
    },
  })) as SessionWithTryout | null;

  if (!session) {
    return null;
  }

  if (session.status === "FINISHED") {
    return session;
  }

  const existingAnswers = (await prisma.answers.findMany({
    where: {
      sessionId: session.id,
    },
    select: {
      questionId: true,
      isCorrect: true,
    },
  })) as AnswerQuestionRecord[];

  const answeredQuestionIds = new Set(
    existingAnswers.map((answer) => answer.questionId),
  );

  let currentLevel = session.currentLevel;
  let answeredCount = existingAnswers.length;

  while (answeredCount < session.totalQuestions) {
    const pendingLog = (await prisma.wrsLog.findFirst({
      where: {
        sessionId: session.id,
        questionId: {
          notIn: Array.from(answeredQuestionIds),
        },
      },
      include: {
        question: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })) as {
      questionId: string;
      question: StudentQuestionCandidate;
    } | null;

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

    let candidates = (await prisma.question.findMany({
      where: {
        subjectId: session.tryout.subjectId,
        difficultyLevel: currentLevel,
        id: {
          notIn: Array.from(answeredQuestionIds),
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    })) as StudentQuestionCandidate[];

    let usedLevel = currentLevel;

    if (candidates.length === 0) {
      for (const level of levels) {
        if (level === currentLevel) continue;

        const fallbackCandidates = (await prisma.question.findMany({
          where: {
            subjectId: session.tryout.subjectId,
            difficultyLevel: level,
            id: {
              notIn: Array.from(answeredQuestionIds),
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        })) as StudentQuestionCandidate[];

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
    include: {
      tryout: {
        include: {
          subject: true,
        },
      },
    },
  });
}

async function finishSessionNormally(sessionId: string) {
  const session = (await prisma.tryoutSession.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      tryout: {
        include: {
          subject: true,
        },
      },
    },
  })) as SessionWithTryout | null;

  if (!session) {
    return null;
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
      correctCount,
      wrongCount,
      score,
      status: "FINISHED",
      finishedAt: new Date(),
    },
    include: {
      tryout: {
        include: {
          subject: true,
        },
      },
    },
  });
}

studentRoutes.get("/check", async (c) => {
  const user = c.get("user");

  return c.json({
    ok: true,
    message: "Student authorized",
    user,
  });
});

studentRoutes.get("/tryouts", async (c) => {
  const tryouts = (await prisma.tryout.findMany({
    include: {
      subject: {
        include: {
          _count: {
            select: {
              questions: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as StudentTryoutRecord[];

  return c.json({
    ok: true,
    tryouts: tryouts.map((tryout) => ({
      id: tryout.id,
      title: tryout.title,
      totalQuestions: tryout.totalQuestions,
      durationMinutes: tryout.durationMinutes,
      createdAt: tryout.createdAt,
      updatedAt: tryout.updatedAt,
      bank: {
        id: tryout.subject.id,
        name: tryout.subject.name,
        totalAvailableQuestions: tryout.subject._count.questions,
      },
    })),
  });
});

studentRoutes.post("/tryouts/start", async (c) => {
  const user = c.get("user");
  const body = await c.req.json().catch(() => null);

  const parsed = z
    .object({
      tryoutId: z.string().min(1, "Tryout wajib dipilih"),
    })
    .safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Data tidak valid",
      },
      400,
    );
  }

  const tryout = (await prisma.tryout.findUnique({
    where: {
      id: parsed.data.tryoutId,
    },
    include: {
      subject: true,
    },
  })) as {
    id: string;
    subjectId: string;
    title: string;
    totalQuestions: number;
    durationMinutes: number;
    subject: {
      id: string;
      name: string;
    };
  } | null;

  if (!tryout) {
    return c.json(
      {
        ok: false,
        message: "Tryout tidak ditemukan",
      },
      404,
    );
  }

  const totalAvailableQuestions = await prisma.question.count({
    where: {
      subjectId: tryout.subjectId,
    },
  });

  if (totalAvailableQuestions === 0) {
    return c.json(
      {
        ok: false,
        message: "Bank soal pada tryout ini belum memiliki soal",
      },
      400,
    );
  }

  if (tryout.totalQuestions > totalAvailableQuestions) {
    return c.json(
      {
        ok: false,
        message: `Jumlah soal tryout (${tryout.totalQuestions}) melebihi jumlah soal tersedia (${totalAvailableQuestions})`,
      },
      400,
    );
  }

  const availableLevels = (
    await Promise.all(
      levels.map(async (level) => {
        const count = await prisma.question.count({
          where: {
            subjectId: tryout.subjectId,
            difficultyLevel: level,
          },
        });

        return count > 0 ? level : null;
      }),
    )
  ).filter((level): level is DifficultyLevel => level !== null);

  const initialLevel = getRandomAvailableLevel(availableLevels);

  const session = await prisma.tryoutSession.create({
    data: {
      userId: user.id,
      tryoutId: tryout.id,
      initialLevel,
      currentLevel: initialLevel,
      totalQuestions: tryout.totalQuestions,
    },
    include: {
      tryout: {
        include: {
          subject: true,
        },
      },
    },
  });

  return c.json(
    {
      ok: true,
      message: "Sesi tryout berhasil dibuat",
      session,
    },
    201,
  );
});

studentRoutes.get("/sessions", async (c) => {
  const user = c.get("user");

  const sessions = await prisma.tryoutSession.findMany({
    where: {
      userId: user.id,
    },
    include: {
      tryout: {
        include: {
          subject: true,
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

  return c.json({
    ok: true,
    sessions,
  });
});

studentRoutes.get("/sessions/:sessionId/next-question", async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("sessionId");

  let session = (await prisma.tryoutSession.findFirst({
    where: {
      id: sessionId,
      userId: user.id,
    },
    include: {
      tryout: {
        include: {
          subject: true,
        },
      },
    },
  })) as SessionWithTryout | null;

  if (!session) {
    return c.json(
      {
        ok: false,
        message: "Sesi tryout tidak ditemukan",
      },
      404,
    );
  }

  if (session.status === "FINISHED") {
    return c.json({
      ok: true,
      finished: true,
      message: "Sesi tryout sudah selesai",
    });
  }

  if (isExpired(session.startedAt, session.tryout.durationMinutes)) {
    await finishSessionByTimeout(session.id, user.id);

    return c.json({
      ok: true,
      finished: true,
      message: "Waktu tryout habis",
    });
  }

  const answers = (await prisma.answers.findMany({
    where: {
      sessionId,
    },
    select: {
      questionId: true,
    },
  })) as QuestionIdRecord[];

  const answeredQuestionIds = answers.map((answer) => answer.questionId);

  if (answeredQuestionIds.length >= session.totalQuestions) {
    await finishSessionNormally(session.id);

    return c.json({
      ok: true,
      finished: true,
      message: "Tryout selesai",
    });
  }

  const pendingLog = (await prisma.wrsLog.findFirst({
    where: {
      sessionId,
      questionId: {
        notIn: answeredQuestionIds,
      },
    },
    include: {
      question: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })) as {
    questionId: string;
    question: StudentQuestionCandidate;
  } | null;

  if (pendingLog) {
    return c.json({
      ok: true,
      finished: false,
      session: getSessionTimerPayload(session, answeredQuestionIds.length),
      question: toStudentQuestion(pendingLog.question),
    });
  }

  let candidates = (await prisma.question.findMany({
    where: {
      subjectId: session.tryout.subjectId,
      difficultyLevel: session.currentLevel,
      id: {
        notIn: answeredQuestionIds,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  })) as StudentQuestionCandidate[];

  let usedLevel = session.currentLevel;

  if (candidates.length === 0) {
    for (const level of levels) {
      if (level === session.currentLevel) continue;

      const fallbackCandidates = (await prisma.question.findMany({
        where: {
          subjectId: session.tryout.subjectId,
          difficultyLevel: level,
          id: {
            notIn: answeredQuestionIds,
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      })) as StudentQuestionCandidate[];

      if (fallbackCandidates.length > 0) {
        candidates = fallbackCandidates;
        usedLevel = level;
        break;
      }
    }
  }

  if (candidates.length === 0) {
    await finishSessionNormally(session.id);

    return c.json({
      ok: true,
      finished: true,
      message: "Semua kandidat soal sudah habis",
    });
  }

  if (usedLevel !== session.currentLevel) {
    session = (await prisma.tryoutSession.update({
      where: {
        id: session.id,
      },
      data: {
        currentLevel: usedLevel,
      },
      include: {
        tryout: {
          include: {
            subject: true,
          },
        },
      },
    })) as SessionWithTryout;
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

  return c.json({
    ok: true,
    finished: false,
    session: getSessionTimerPayload(session, answeredQuestionIds.length),
    question: toStudentQuestion(selection.selected),
  });
});

studentRoutes.post("/sessions/:sessionId/answer", async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("sessionId");
  const body = await c.req.json().catch(() => null);

  const parsed = z
    .object({
      questionId: z.string().min(1, "Soal wajib dikirim"),
      selectedAnswer: z.enum(["A", "B", "C", "D"]),
    })
    .safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Jawaban tidak valid",
      },
      400,
    );
  }

  const session = (await prisma.tryoutSession.findFirst({
    where: {
      id: sessionId,
      userId: user.id,
    },
    include: {
      tryout: {
        include: {
          subject: true,
        },
      },
    },
  })) as SessionWithTryout | null;

  if (!session) {
    return c.json(
      {
        ok: false,
        message: "Sesi tryout tidak ditemukan",
      },
      404,
    );
  }

  if (session.status === "FINISHED") {
    return c.json({
      ok: true,
      message: "Sesi tryout sudah selesai",
      finished: true,
      session,
    });
  }

  if (isExpired(session.startedAt, session.tryout.durationMinutes)) {
    const updatedSession = await finishSessionByTimeout(session.id, user.id);

    return c.json({
      ok: true,
      message: "Waktu tryout habis",
      finished: true,
      session: updatedSession,
    });
  }

  const question = (await prisma.question.findFirst({
    where: {
      id: parsed.data.questionId,
      subjectId: session.tryout.subjectId,
    },
  })) as
    | (StudentQuestionCandidate & {
        correctAnswer: AnswerOption;
      })
    | null;

  if (!question) {
    return c.json(
      {
        ok: false,
        message: "Soal tidak valid untuk sesi ini",
      },
      400,
    );
  }

  const selectedLog = await prisma.wrsLog.findFirst({
    where: {
      sessionId: session.id,
      questionId: question.id,
    },
  });

  if (!selectedLog) {
    return c.json(
      {
        ok: false,
        message: "Soal ini tidak berasal dari proses pemilihan WRS sesi ini",
      },
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
  });

  if (existingAnswer) {
    return c.json(
      {
        ok: false,
        message: "Soal ini sudah dijawab",
      },
      400,
    );
  }

  const selectedAnswer = parsed.data.selectedAnswer as AnswerOption;
  const isCorrect = selectedAnswer === question.correctAnswer;
  const nextLevel = updateLevelAfterAnswer(session.currentLevel, isCorrect);

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

  await prisma.answers.create({
    data: {
      sessionId: session.id,
      questionId: question.id,
      selectedAnswer,
      isCorrect,
    },
  });

  const updatedSession = await prisma.tryoutSession.update({
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
    include: {
      tryout: {
        include: {
          subject: true,
        },
      },
    },
  });

  return c.json({
    ok: true,
    message: "Jawaban berhasil disimpan",
    isCorrect,
    selectedAnswer,
    previousLevel: session.currentLevel,
    currentLevel: nextLevel,
    finished: isFinished,
    session: updatedSession,
  });
});

studentRoutes.post("/sessions/:sessionId/timeout", async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("sessionId");

  const session = (await prisma.tryoutSession.findFirst({
    where: {
      id: sessionId,
      userId: user.id,
    },
    include: {
      tryout: {
        include: {
          subject: true,
        },
      },
    },
  })) as SessionWithTryout | null;

  if (!session) {
    return c.json(
      {
        ok: false,
        message: "Sesi tryout tidak ditemukan",
      },
      404,
    );
  }

  if (session.status === "FINISHED") {
    return c.json({
      ok: true,
      message: "Sesi tryout sudah selesai",
      finished: true,
      session,
    });
  }

  if (!isExpired(session.startedAt, session.tryout.durationMinutes)) {
    return c.json(
      {
        ok: false,
        message: "Waktu tryout belum habis",
      },
      400,
    );
  }

  const updatedSession = await finishSessionByTimeout(session.id, user.id);

  return c.json({
    ok: true,
    message: "Waktu tryout habis. Soal yang belum dijawab dihitung salah.",
    finished: true,
    session: updatedSession,
  });
});

studentRoutes.get("/sessions/:sessionId/result", async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("sessionId");

  const session = (await prisma.tryoutSession.findFirst({
    where: {
      id: sessionId,
      userId: user.id,
    },
    include: {
      tryout: {
        include: {
          subject: true,
        },
      },
      answers: {
        include: {
          question: true,
        },
        orderBy: {
          answeredAt: "asc",
        },
      },
      wrsLogs: {
        include: {
          question: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  })) as ResultSessionRecord | null;

  if (!session) {
    return c.json(
      {
        ok: false,
        message: "Hasil tryout tidak ditemukan",
      },
      404,
    );
  }

  return c.json({
    ok: true,
    session: {
      id: session.id,
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
  });
});

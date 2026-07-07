import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import { selectQuestionByWrs } from "../lib/wrs";
import {
  getRandomAvailableLevel,
  updateLevelAfterAnswer,
} from "../lib/tryout-level";
import type { AppEnv } from "../types/hono";
import type { DifficultyLevel } from "../generated/prisma/client";

export const studentRoutes = new Hono<AppEnv>();

studentRoutes.use("*", authMiddleware, roleMiddleware(["STUDENT"]));

const levels: DifficultyLevel[] = ["LOW", "MEDIUM", "HIGH"];

function calculateScore(correctCount: number, totalQuestions: number) {
  if (totalQuestions <= 0) return 0;
  return Math.round((correctCount / totalQuestions) * 100);
}

function toStudentQuestion(question: {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficultyLevel: DifficultyLevel;
}) {
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

studentRoutes.get("/check", async (c) => {
  const user = c.get("user");

  return c.json({
    ok: true,
    message: "Student authorized",
    user,
  });
});

studentRoutes.get("/tryouts", async (c) => {
  const tryouts = await prisma.tryout.findMany({
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
  });

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

  const tryout = await prisma.tryout.findUnique({
    where: {
      id: parsed.data.tryoutId,
    },
    include: {
      subject: true,
    },
  });

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

  const difficultyGroups = await prisma.question.groupBy({
    by: ["difficultyLevel"],
    where: {
      subjectId: tryout.subjectId,
    },
    _count: {
      difficultyLevel: true,
    },
  });

  const availableLevels = difficultyGroups
    .filter((group) => group._count.difficultyLevel > 0)
    .map((group) => group.difficultyLevel)
    .filter((level): level is DifficultyLevel => Boolean(level));

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

  let session = await prisma.tryoutSession.findFirst({
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
  });

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
    const score = calculateScore(session.correctCount, session.totalQuestions);

    await prisma.tryoutSession.update({
      where: {
        id: session.id,
      },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
        score,
      },
    });

    return c.json({
      ok: true,
      finished: true,
      message: "Tryout selesai",
    });
  }

  const pendingLog = await prisma.wrsLog.findFirst({
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
  });

  if (pendingLog) {
    return c.json({
      ok: true,
      finished: false,
      session: {
        id: session.id,
        initialLevel: session.initialLevel,
        currentLevel: session.currentLevel,
        totalQuestions: session.totalQuestions,
        answeredCount: answeredQuestionIds.length,
        correctCount: session.correctCount,
        wrongCount: session.wrongCount,
      },
      question: toStudentQuestion(pendingLog.question),
    });
  }

  let candidates = await prisma.question.findMany({
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
  });

  let usedLevel = session.currentLevel;

  if (candidates.length === 0) {
    for (const level of levels) {
      if (level === session.currentLevel) continue;

      const fallbackCandidates = await prisma.question.findMany({
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
      });

      if (fallbackCandidates.length > 0) {
        candidates = fallbackCandidates;
        usedLevel = level;
        break;
      }
    }
  }

  if (candidates.length === 0) {
    const score = calculateScore(session.correctCount, session.totalQuestions);

    await prisma.tryoutSession.update({
      where: {
        id: session.id,
      },
      data: {
        status: "FINISHED",
        finishedAt: new Date(),
        score,
      },
    });

    return c.json({
      ok: true,
      finished: true,
      message: "Semua kandidat soal sudah habis",
    });
  }

  if (usedLevel !== session.currentLevel) {
    session = await prisma.tryoutSession.update({
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
    });
  }

  const selection = selectQuestionByWrs(candidates);

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
    session: {
      id: session.id,
      initialLevel: session.initialLevel,
      currentLevel: session.currentLevel,
      totalQuestions: session.totalQuestions,
      answeredCount: answeredQuestionIds.length,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
    },
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

  const session = await prisma.tryoutSession.findFirst({
    where: {
      id: sessionId,
      userId: user.id,
    },
    include: {
      tryout: true,
    },
  });

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
    return c.json(
      {
        ok: false,
        message: "Sesi tryout sudah selesai",
      },
      400,
    );
  }

  const question = await prisma.question.findFirst({
    where: {
      id: parsed.data.questionId,
      subjectId: session.tryout.subjectId,
    },
  });

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

  const isCorrect = parsed.data.selectedAnswer === question.correctAnswer;
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
      selectedAnswer: parsed.data.selectedAnswer,
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
  });

  return c.json({
    ok: true,
    message: "Jawaban berhasil disimpan",
    isCorrect,
    selectedAnswer: parsed.data.selectedAnswer,
    previousLevel: session.currentLevel,
    currentLevel: updatedSession.currentLevel,
    finished: isFinished,
    session: updatedSession,
  });
});

studentRoutes.get("/sessions/:sessionId/result", async (c) => {
  const user = c.get("user");
  const sessionId = c.req.param("sessionId");

  const session = await prisma.tryoutSession.findFirst({
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
  });

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

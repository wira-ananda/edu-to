import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/auth.js";
import { roleMiddleware } from "../middlewares/role.js";
import {
  classifyQuestionDifficulty,
  getWeightFromPriority,
} from "../lib/question-difficulty.js";
import type {
  DifficultyLevel,
  WeightPriority,
} from "@prisma/client";
import type { AppEnv } from "../types/hono.js";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", authMiddleware, roleMiddleware(["ADMIN"]));

const difficultyLevels: DifficultyLevel[] = ["LOW", "MEDIUM", "HIGH"];
const weightPriorities: WeightPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "VERY_HIGH",
];

const tryoutSchema = z.object({
  subjectId: z.string().min(1, "Bank soal wajib dipilih"),
  title: z.string().min(3, "Judul tryout minimal 3 karakter"),
  totalQuestions: z.number().int().min(1, "Jumlah soal minimal 1"),
  durationMinutes: z.number().int().min(1, "Durasi minimal 1 menit"),
});

async function validateTryoutQuestionAvailability(
  subjectId: string,
  totalQuestions: number,
) {
  const subject = await prisma.subject.findUnique({
    where: {
      id: subjectId,
    },
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  if (!subject) {
    return {
      ok: false as const,
      message: "Bank soal tidak ditemukan",
    };
  }

  if (subject._count.questions === 0) {
    return {
      ok: false as const,
      message: "Bank soal ini belum memiliki soal",
    };
  }

  if (totalQuestions > subject._count.questions) {
    return {
      ok: false as const,
      message: `Jumlah soal tryout (${totalQuestions}) melebihi jumlah soal tersedia (${subject._count.questions})`,
    };
  }

  return {
    ok: true as const,
    subject,
  };
}

const questionSchema = z.object({
  subjectId: z.string().min(1, "Mata pelajaran wajib dipilih"),
  questionText: z.string().min(5, "Teks soal minimal 5 karakter"),
  optionA: z.string().min(1, "Option A wajib diisi"),
  optionB: z.string().min(1, "Option B wajib diisi"),
  optionC: z.string().min(1, "Option C wajib diisi"),
  optionD: z.string().min(1, "Option D wajib diisi"),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  weightPriority: z
    .enum(["LOW", "NORMAL", "HIGH", "VERY_HIGH"])
    .default("NORMAL"),
});

adminRoutes.get("/check", async (c) => {
  const user = c.get("user");

  return c.json({
    ok: true,
    message: "Admin authorized",
    user,
  });
});

adminRoutes.get("/subjects", async (c) => {
  const subjects = await prisma.subject.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return c.json({
    ok: true,
    subjects,
  });
});

adminRoutes.post("/subjects", async (c) => {
  const body = await c.req.json().catch(() => null);

  const parsed = z
    .object({
      name: z.string().min(2, "Nama mata pelajaran wajib diisi"),
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

  const subject = await prisma.subject.upsert({
    where: {
      name: parsed.data.name.trim(),
    },
    update: {},
    create: {
      name: parsed.data.name.trim(),
    },
  });

  return c.json({
    ok: true,
    subject,
  });
});

adminRoutes.post("/questions/analyze", async (c) => {
  const body = await c.req.json().catch(() => null);

  const parsed = z
    .object({
      questionText: z.string().min(5, "Teks soal minimal 5 karakter"),
      weightPriority: z
        .enum(["LOW", "NORMAL", "HIGH", "VERY_HIGH"])
        .default("NORMAL"),
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

  const difficulty = classifyQuestionDifficulty(parsed.data.questionText);
  const weight = getWeightFromPriority(parsed.data.weightPriority);

  return c.json({
    ok: true,
    result: {
      ...difficulty,
      weightPriority: parsed.data.weightPriority,
      weight,
    },
  });
});

adminRoutes.get("/questions", async (c) => {
  const search = c.req.query("search") ?? "";
  const subjectId = c.req.query("subjectId") ?? "";
  const difficultyLevelQuery = c.req.query("difficultyLevel") as
    | DifficultyLevel
    | undefined;
  const weightPriorityQuery = c.req.query("weightPriority") as
    | WeightPriority
    | undefined;

  const difficultyLevel =
    difficultyLevelQuery && difficultyLevels.includes(difficultyLevelQuery)
      ? difficultyLevelQuery
      : undefined;

  const weightPriority =
    weightPriorityQuery && weightPriorities.includes(weightPriorityQuery)
      ? weightPriorityQuery
      : undefined;

  const questions = await prisma.question.findMany({
    where: {
      AND: [
        search
          ? {
              questionText: {
                contains: search,
                mode: "insensitive",
              },
            }
          : {},
        subjectId ? { subjectId } : {},
        difficultyLevel ? { difficultyLevel } : {},
        weightPriority ? { weightPriority } : {},
      ],
    },
    include: {
      subject: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return c.json({
    ok: true,
    questions,
  });
});

adminRoutes.get("/question-banks", async (c) => {
  const subjects = await prisma.subject.findMany({
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
      questions: {
        select: {
          difficultyLevel: true,
          weightPriority: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const banks = subjects.map((subject) => {
    const difficultyCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    const priorityCounts = {
      LOW: 0,
      NORMAL: 0,
      HIGH: 0,
      VERY_HIGH: 0,
    };

    for (const question of subject.questions) {
      difficultyCounts[question.difficultyLevel] += 1;
      priorityCounts[question.weightPriority] += 1;
    }

    return {
      id: subject.id,
      name: subject.name,
      totalQuestions: subject._count.questions,
      difficultyCounts,
      priorityCounts,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };
  });

  return c.json({
    ok: true,
    banks,
  });
});

adminRoutes.post("/subjects", async (c) => {
  const body = await c.req.json().catch(() => null);

  const parsed = z
    .object({
      name: z.string().min(2, "Nama mata pelajaran wajib diisi"),
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

  const subject = await prisma.subject.upsert({
    where: {
      name: parsed.data.name.trim(),
    },
    update: {},
    create: {
      name: parsed.data.name.trim(),
    },
  });

  return c.json({
    ok: true,
    subject,
  });
});

adminRoutes.get("/questions/:id", async (c) => {
  const id = c.req.param("id");

  const question = await prisma.question.findUnique({
    where: {
      id,
    },
    include: {
      subject: true,
    },
  });

  if (!question) {
    return c.json(
      {
        ok: false,
        message: "Soal tidak ditemukan",
      },
      404,
    );
  }

  return c.json({
    ok: true,
    question,
  });
});

adminRoutes.post("/questions", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Data soal tidak valid",
      },
      400,
    );
  }

  const difficulty = classifyQuestionDifficulty(parsed.data.questionText);
  const weight = getWeightFromPriority(parsed.data.weightPriority);

  const question = await prisma.question.create({
    data: {
      subjectId: parsed.data.subjectId,
      questionText: parsed.data.questionText,
      optionA: parsed.data.optionA,
      optionB: parsed.data.optionB,
      optionC: parsed.data.optionC,
      optionD: parsed.data.optionD,
      correctAnswer: parsed.data.correctAnswer,
      difficultyLevel: difficulty.difficultyLevel,
      difficultyScore: difficulty.difficultyScore,
      detectedIndicators: difficulty.detectedIndicators,
      weightPriority: parsed.data.weightPriority,
      weight,
    },
    include: {
      subject: true,
    },
  });

  return c.json(
    {
      ok: true,
      message: "Soal berhasil ditambahkan",
      question,
    },
    201,
  );
});

adminRoutes.put("/questions/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Data soal tidak valid",
      },
      400,
    );
  }

  const existingQuestion = await prisma.question.findUnique({
    where: {
      id,
    },
  });

  if (!existingQuestion) {
    return c.json(
      {
        ok: false,
        message: "Soal tidak ditemukan",
      },
      404,
    );
  }

  const difficulty = classifyQuestionDifficulty(parsed.data.questionText);
  const weight = getWeightFromPriority(parsed.data.weightPriority);

  const question = await prisma.question.update({
    where: {
      id,
    },
    data: {
      subjectId: parsed.data.subjectId,
      questionText: parsed.data.questionText,
      optionA: parsed.data.optionA,
      optionB: parsed.data.optionB,
      optionC: parsed.data.optionC,
      optionD: parsed.data.optionD,
      correctAnswer: parsed.data.correctAnswer,
      difficultyLevel: difficulty.difficultyLevel,
      difficultyScore: difficulty.difficultyScore,
      detectedIndicators: difficulty.detectedIndicators,
      weightPriority: parsed.data.weightPriority,
      weight,
    },
    include: {
      subject: true,
    },
  });

  return c.json({
    ok: true,
    message: "Soal berhasil diperbarui",
    question,
  });
});

adminRoutes.delete("/questions/:id", async (c) => {
  const id = c.req.param("id");

  const existingQuestion = await prisma.question.findUnique({
    where: {
      id,
    },
  });

  if (!existingQuestion) {
    return c.json(
      {
        ok: false,
        message: "Soal tidak ditemukan",
      },
      404,
    );
  }

  await prisma.question.delete({
    where: {
      id,
    },
  });

  return c.json({
    ok: true,
    message: "Soal berhasil dihapus",
  });
});
adminRoutes.get("/tryouts", async (c) => {
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
      _count: {
        select: {
          sessions: true,
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
      totalSessions: tryout._count.sessions,
    })),
  });
});

adminRoutes.get("/tryouts/:id", async (c) => {
  const id = c.req.param("id");

  const tryout = await prisma.tryout.findUnique({
    where: {
      id,
    },
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
      _count: {
        select: {
          sessions: true,
        },
      },
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

  return c.json({
    ok: true,
    tryout: {
      id: tryout.id,
      subjectId: tryout.subjectId,
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
      totalSessions: tryout._count.sessions,
    },
  });
});

adminRoutes.post("/tryouts", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = tryoutSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Data tryout tidak valid",
      },
      400,
    );
  }

  const validation = await validateTryoutQuestionAvailability(
    parsed.data.subjectId,
    parsed.data.totalQuestions,
  );

  if (!validation.ok) {
    return c.json(
      {
        ok: false,
        message: validation.message,
      },
      400,
    );
  }

  const tryout = await prisma.tryout.create({
    data: {
      subjectId: parsed.data.subjectId,
      title: parsed.data.title.trim(),
      totalQuestions: parsed.data.totalQuestions,
      durationMinutes: parsed.data.durationMinutes,
    },
    include: {
      subject: true,
    },
  });

  return c.json(
    {
      ok: true,
      message: "Tryout berhasil dibuat",
      tryout,
    },
    201,
  );
});

adminRoutes.put("/tryouts/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json().catch(() => null);
  const parsed = tryoutSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Data tryout tidak valid",
      },
      400,
    );
  }

  const existingTryout = await prisma.tryout.findUnique({
    where: {
      id,
    },
  });

  if (!existingTryout) {
    return c.json(
      {
        ok: false,
        message: "Tryout tidak ditemukan",
      },
      404,
    );
  }

  const validation = await validateTryoutQuestionAvailability(
    parsed.data.subjectId,
    parsed.data.totalQuestions,
  );

  if (!validation.ok) {
    return c.json(
      {
        ok: false,
        message: validation.message,
      },
      400,
    );
  }

  const tryout = await prisma.tryout.update({
    where: {
      id,
    },
    data: {
      subjectId: parsed.data.subjectId,
      title: parsed.data.title.trim(),
      totalQuestions: parsed.data.totalQuestions,
      durationMinutes: parsed.data.durationMinutes,
    },
    include: {
      subject: true,
    },
  });

  return c.json({
    ok: true,
    message: "Tryout berhasil diperbarui",
    tryout,
  });
});

adminRoutes.delete("/tryouts/:id", async (c) => {
  const id = c.req.param("id");

  const existingTryout = await prisma.tryout.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          sessions: true,
        },
      },
    },
  });

  if (!existingTryout) {
    return c.json(
      {
        ok: false,
        message: "Tryout tidak ditemukan",
      },
      404,
    );
  }

  if (existingTryout._count.sessions > 0) {
    return c.json(
      {
        ok: false,
        message:
          "Tryout tidak dapat dihapus karena sudah memiliki sesi pengerjaan siswa",
      },
      400,
    );
  }

  await prisma.tryout.delete({
    where: {
      id,
    },
  });

  return c.json({
    ok: true,
    message: "Tryout berhasil dihapus",
  });
});

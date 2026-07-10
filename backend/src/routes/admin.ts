import { Hono } from "hono";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middlewares/auth.js";
import { roleMiddleware } from "../middlewares/role.js";
import {
  classifyQuestionDifficulty,
  getWeightFromPriority,
} from "../lib/question-difficulty.js";
import {
  deleteQuestionImage,
  isQuestionImageFile,
  uploadQuestionImage,
  type QuestionImageFile,
  type UploadedQuestionImage,
} from "../lib/question-image-storage.js";
import type { AppEnv } from "../types/hono.js";
import type { DifficultyLevel, WeightPriority } from "../types/domain.js";

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
  subjectId: z.string().trim().min(1, "Bank soal wajib dipilih"),

  title: z.string().trim().min(3, "Judul tryout minimal 3 karakter"),

  totalQuestions: z.number().int().min(1, "Jumlah soal minimal 1"),

  durationMinutes: z.number().int().min(1, "Durasi minimal 1 menit"),
});

const questionSchema = z.object({
  subjectId: z.string().trim().min(1, "Mata pelajaran wajib dipilih"),

  questionText: z.string().trim().min(5, "Teks soal minimal 5 karakter"),

  imageAltText: z
    .string()
    .trim()
    .max(250, "Alt text maksimal 250 karakter")
    .optional()
    .nullable(),

  optionA: z.string().trim().min(1, "Option A wajib diisi"),

  optionB: z.string().trim().min(1, "Option B wajib diisi"),

  optionC: z.string().trim().min(1, "Option C wajib diisi"),

  optionD: z.string().trim().min(1, "Option D wajib diisi"),

  correctAnswer: z.enum(["A", "B", "C", "D"]),

  weightPriority: z
    .enum(["LOW", "NORMAL", "HIGH", "VERY_HIGH"])
    .default("NORMAL"),

  removeImage: z.boolean().optional().default(false),
});

type QuestionRequestReader = {
  contentType: string;
  parseBody: () => Promise<unknown>;
  parseJson: () => Promise<unknown>;
};

type NormalizedQuestionBody = {
  subjectId: string;
  questionText: string;
  imageAltText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  weightPriority: string;
  removeImage: boolean;
};

type ParsedQuestionRequest = {
  data: NormalizedQuestionBody;
  imageFile: QuestionImageFile | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cleanOptionalText(value?: string | null): string | null {
  const cleanedValue = value?.trim();

  return cleanedValue || null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan pada server.";
}

function getTextField(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (Array.isArray(value)) {
    const textValue = value.find((item) => typeof item === "string");

    return typeof textValue === "string" ? textValue : "";
  }

  return typeof value === "string" ? value : "";
}

function getBooleanField(body: Record<string, unknown>, key: string) {
  const value = body[key];

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  const normalizedValue = getTextField(body, key).toLowerCase();

  return (
    normalizedValue === "true" ||
    normalizedValue === "1" ||
    normalizedValue === "yes"
  );
}

function getFileField(
  body: Record<string, unknown>,
  key: string,
): QuestionImageFile | null {
  const value = body[key];

  if (Array.isArray(value)) {
    const fileValue = value.find((item) => isQuestionImageFile(item));

    return isQuestionImageFile(fileValue) ? fileValue : null;
  }

  return isQuestionImageFile(value) ? value : null;
}

function normalizeQuestionRequestBody(
  body: Record<string, unknown>,
): NormalizedQuestionBody {
  return {
    subjectId: getTextField(body, "subjectId"),
    questionText: getTextField(body, "questionText"),
    imageAltText: getTextField(body, "imageAltText"),
    optionA: getTextField(body, "optionA"),
    optionB: getTextField(body, "optionB"),
    optionC: getTextField(body, "optionC"),
    optionD: getTextField(body, "optionD"),
    correctAnswer: getTextField(body, "correctAnswer"),

    weightPriority: getTextField(body, "weightPriority") || "NORMAL",

    removeImage: getBooleanField(body, "removeImage"),
  };
}

async function parseQuestionRequest(
  reader: QuestionRequestReader,
): Promise<ParsedQuestionRequest> {
  if (reader.contentType.includes("multipart/form-data")) {
    const parsedBody = await reader.parseBody();

    const body = isRecord(parsedBody) ? parsedBody : {};

    return {
      data: normalizeQuestionRequestBody(body),
      imageFile: getFileField(body, "image"),
    };
  }

  let parsedJson: unknown = null;

  try {
    parsedJson = await reader.parseJson();
  } catch {
    parsedJson = null;
  }

  const body = isRecord(parsedJson) ? parsedJson : {};

  return {
    data: normalizeQuestionRequestBody(body),
    imageFile: null,
  };
}

async function validateSubjectExists(subjectId: string) {
  return prisma.subject.findUnique({
    where: {
      id: subjectId,
    },
    select: {
      id: true,
    },
  });
}

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
      message:
        `Jumlah soal tryout (${totalQuestions}) ` +
        `melebihi jumlah soal tersedia ` +
        `(${subject._count.questions})`,
    };
  }

  return {
    ok: true as const,
    subject,
  };
}

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
      name: z.string().trim().min(2, "Nama mata pelajaran wajib diisi"),
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
      name: parsed.data.name,
    },
    update: {},
    create: {
      name: parsed.data.name,
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
      questionText: z.string().trim().min(5, "Teks soal minimal 5 karakter"),

      imageAltText: z
        .string()
        .trim()
        .max(250, "Alt text maksimal 250 karakter")
        .optional()
        .nullable(),

      hasImage: z.boolean().optional().default(false),

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

  const difficulty = classifyQuestionDifficulty({
    questionText: parsed.data.questionText,

    imageAltText: cleanOptionalText(parsed.data.imageAltText),

    hasImage: parsed.data.hasImage,
  });

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
  const search = c.req.query("search")?.trim() ?? "";

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

  const filters: Prisma.QuestionWhereInput[] = [];

  if (search) {
    const searchFilter: Prisma.QuestionWhereInput = {
      OR: [
        {
          questionText: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          imageAltText: {
            contains: search,
            mode: "insensitive",
          },
        },
      ],
    };

    filters.push(searchFilter);
  }

  if (subjectId) {
    filters.push({
      subjectId,
    });
  }

  if (difficultyLevel) {
    filters.push({
      difficultyLevel,
    });
  }

  if (weightPriority) {
    filters.push({
      weightPriority,
    });
  }

  const where: Prisma.QuestionWhereInput =
    filters.length > 0
      ? {
          AND: filters,
        }
      : {};

  const questions = await prisma.question.findMany({
    where,
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
    const difficultyCounts: Record<DifficultyLevel, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
    };

    const priorityCounts: Record<WeightPriority, number> = {
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
  let uploadedImage: UploadedQuestionImage | null = null;

  try {
    const request = await parseQuestionRequest({
      contentType: c.req.header("content-type") ?? "",

      parseBody: async () => c.req.parseBody(),

      parseJson: async () => c.req.json(),
    });

    const parsed = questionSchema.safeParse(request.data);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message ?? "Data soal tidak valid",
        },
        400,
      );
    }

    const subject = await validateSubjectExists(parsed.data.subjectId);

    if (!subject) {
      return c.json(
        {
          ok: false,
          message: "Mata pelajaran tidak ditemukan",
        },
        404,
      );
    }

    const cleanedImageAltText = cleanOptionalText(parsed.data.imageAltText);

    if (request.imageFile && !cleanedImageAltText) {
      return c.json(
        {
          ok: false,
          message: "Deskripsi gambar wajib diisi jika gambar digunakan.",
        },
        400,
      );
    }

    if (request.imageFile) {
      uploadedImage = await uploadQuestionImage(
        request.imageFile,
        parsed.data.subjectId,
      );
    }

    const imageAltText = uploadedImage ? cleanedImageAltText : null;

    const difficulty = classifyQuestionDifficulty({
      questionText: parsed.data.questionText,

      imageAltText,

      hasImage: Boolean(uploadedImage),
    });

    const weight = getWeightFromPriority(parsed.data.weightPriority);

    const question = await prisma.question.create({
      data: {
        subjectId: parsed.data.subjectId,

        questionText: parsed.data.questionText,

        imageUrl: uploadedImage?.imageUrl ?? null,

        imagePath: uploadedImage?.imagePath ?? null,

        imageAltText,

        optionA: parsed.data.optionA,
        optionB: parsed.data.optionB,
        optionC: parsed.data.optionC,
        optionD: parsed.data.optionD,

        correctAnswer: parsed.data.correctAnswer,

        difficultyLevel: difficulty.difficultyLevel,

        difficultyScore: difficulty.difficultyScore,

        detectedIndicators:
          difficulty.detectedIndicators as Prisma.InputJsonValue,

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
  } catch (error) {
    if (uploadedImage?.imagePath) {
      await deleteQuestionImage(uploadedImage.imagePath);
    }

    return c.json(
      {
        ok: false,
        message: getErrorMessage(error),
      },
      400,
    );
  }
});

adminRoutes.put("/questions/:id", async (c) => {
  const id = c.req.param("id");

  let uploadedImage: UploadedQuestionImage | null = null;

  try {
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

    const request = await parseQuestionRequest({
      contentType: c.req.header("content-type") ?? "",

      parseBody: async () => c.req.parseBody(),

      parseJson: async () => c.req.json(),
    });

    const parsed = questionSchema.safeParse(request.data);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: parsed.error.issues[0]?.message ?? "Data soal tidak valid",
        },
        400,
      );
    }

    const subject = await validateSubjectExists(parsed.data.subjectId);

    if (!subject) {
      return c.json(
        {
          ok: false,
          message: "Mata pelajaran tidak ditemukan",
        },
        404,
      );
    }

    const willHaveImage = Boolean(
      request.imageFile ||
      (!parsed.data.removeImage && existingQuestion.imageUrl),
    );

    const cleanedImageAltText = cleanOptionalText(parsed.data.imageAltText);

    if (willHaveImage && !cleanedImageAltText) {
      return c.json(
        {
          ok: false,
          message: "Deskripsi gambar wajib diisi jika gambar digunakan.",
        },
        400,
      );
    }

    if (request.imageFile) {
      uploadedImage = await uploadQuestionImage(
        request.imageFile,
        parsed.data.subjectId,
      );
    }

    const imageAltText = willHaveImage ? cleanedImageAltText : null;

    const difficulty = classifyQuestionDifficulty({
      questionText: parsed.data.questionText,

      imageAltText,

      hasImage: willHaveImage,
    });

    const weight = getWeightFromPriority(parsed.data.weightPriority);

    const shouldDeleteOldImage = Boolean(
      existingQuestion.imagePath && (uploadedImage || parsed.data.removeImage),
    );

    const question = await prisma.question.update({
      where: {
        id,
      },
      data: {
        subjectId: parsed.data.subjectId,

        questionText: parsed.data.questionText,

        ...(uploadedImage
          ? {
              imageUrl: uploadedImage.imageUrl,

              imagePath: uploadedImage.imagePath,

              imageAltText,
            }
          : parsed.data.removeImage
            ? {
                imageUrl: null,
                imagePath: null,
                imageAltText: null,
              }
            : {
                imageAltText,
              }),

        optionA: parsed.data.optionA,
        optionB: parsed.data.optionB,
        optionC: parsed.data.optionC,
        optionD: parsed.data.optionD,

        correctAnswer: parsed.data.correctAnswer,

        difficultyLevel: difficulty.difficultyLevel,

        difficultyScore: difficulty.difficultyScore,

        detectedIndicators:
          difficulty.detectedIndicators as Prisma.InputJsonValue,

        weightPriority: parsed.data.weightPriority,

        weight,
      },
      include: {
        subject: true,
      },
    });

    if (shouldDeleteOldImage && existingQuestion.imagePath) {
      await deleteQuestionImage(existingQuestion.imagePath);
    }

    return c.json({
      ok: true,
      message: "Soal berhasil diperbarui",
      question,
    });
  } catch (error) {
    if (uploadedImage?.imagePath) {
      await deleteQuestionImage(uploadedImage.imagePath);
    }

    return c.json(
      {
        ok: false,
        message: getErrorMessage(error),
      },
      400,
    );
  }
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

  await deleteQuestionImage(existingQuestion.imagePath);

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

      title: parsed.data.title,

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

      title: parsed.data.title,

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

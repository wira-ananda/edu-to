import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  classifyQuestionDifficulty,
  getWeightFromPriority,
} from "../lib/question-difficulty.js";
import {
  deleteQuestionImage,
  uploadQuestionImage,
  type QuestionImageFile,
  type UploadedQuestionImage,
} from "../lib/question-image-storage.js";
import type { DifficultyLevel, WeightPriority } from "../types/domain.js";
import {
  difficultyLevels,
  weightPriorities,
  tryoutStatuses,
  type AdminAnalyzeQuestionInput,
  type AdminQuestionInput,
  type AdminSubjectInput,
  type AdminTryoutInput,
  type AdminTryoutStatusInput,
} from "../schema/admin.schema.js";

export class AdminServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
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

function calculateAverageScore(scores: number[]) {
  if (scores.length === 0) {
    return 0;
  }

  return Math.round(
    scores.reduce((total, score) => total + score, 0) / scores.length,
  );
}

async function validateTeacherOwner(ownerId?: string | null) {
  const cleanedOwnerId = cleanOptionalText(ownerId);

  if (!cleanedOwnerId) {
    return {
      ok: true as const,
      ownerId: null,
    };
  }

  const teacher = await prisma.user.findFirst({
    where: {
      id: cleanedOwnerId,
      role: "TEACHER",
    },
    select: {
      id: true,
    },
  });

  if (!teacher) {
    return {
      ok: false as const,
      message: "Teacher tidak ditemukan",
    };
  }

  return {
    ok: true as const,
    ownerId: teacher.id,
  };
}

async function validateSubjectExists(subjectId: string) {
  return prisma.subject.findUnique({
    where: {
      id: subjectId,
    },
    select: {
      id: true,
      ownerId: true,
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

async function getSubjects(ownerIdQuery?: string) {
  const where: Prisma.SubjectWhereInput = ownerIdQuery
    ? {
        ownerId: ownerIdQuery === "none" ? null : ownerIdQuery,
      }
    : {};

  const subjects = await prisma.subject.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      _count: {
        select: {
          questions: true,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return {
    subjects: subjects.map((subject) => ({
      id: subject.id,
      name: subject.name,
      ownerId: subject.ownerId,
      owner: subject.owner,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      totalAvailableQuestions: subject._count.questions,
    })),
  };
}

async function createSubject(input: AdminSubjectInput) {
  const ownerValidation = await validateTeacherOwner(input.ownerId);

  if (!ownerValidation.ok) {
    throw new AdminServiceError(ownerValidation.message, 404);
  }

  const existingSubject = await prisma.subject.findFirst({
    where: {
      name: input.name,
      ownerId: ownerValidation.ownerId,
    },
  });

  const subject =
    existingSubject ??
    (await prisma.subject.create({
      data: {
        name: input.name,
        ownerId: ownerValidation.ownerId,
      },
    }));

  return {
    subject,
  };
}

function analyzeQuestion(input: AdminAnalyzeQuestionInput) {
  const difficulty = classifyQuestionDifficulty({
    questionText: input.questionText,
    imageAltText: cleanOptionalText(input.imageAltText),
    hasImage: input.hasImage,
  });

  const weight = getWeightFromPriority(input.weightPriority);

  return {
    result: {
      ...difficulty,
      weightPriority: input.weightPriority,
      weight,
    },
  };
}

async function getQuestions(query: {
  search?: string;
  subjectId?: string;
  ownerId?: string;
  difficultyLevel?: DifficultyLevel;
  weightPriority?: WeightPriority;
}) {
  const filters: Prisma.QuestionWhereInput[] = [];

  if (query.search) {
    filters.push({
      OR: [
        {
          questionText: {
            contains: query.search,
            mode: "insensitive",
          },
        },
        {
          imageAltText: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (query.subjectId) {
    filters.push({
      subjectId: query.subjectId,
    });
  }

  if (query.ownerId) {
    filters.push({
      ownerId: query.ownerId === "none" ? null : query.ownerId,
    });
  }

  if (
    query.difficultyLevel &&
    difficultyLevels.includes(query.difficultyLevel)
  ) {
    filters.push({
      difficultyLevel: query.difficultyLevel,
    });
  }

  if (query.weightPriority && weightPriorities.includes(query.weightPriority)) {
    filters.push({
      weightPriority: query.weightPriority,
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
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    questions,
  };
}

async function getQuestionBanks() {
  const subjects = await prisma.subject.findMany({
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
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
      const difficulty = question.difficultyLevel as DifficultyLevel;
      const priority = question.weightPriority as WeightPriority;

      difficultyCounts[difficulty] += 1;
      priorityCounts[priority] += 1;
    }

    return {
      id: subject.id,
      name: subject.name,
      ownerId: subject.ownerId,
      owner: subject.owner,
      totalQuestions: subject._count.questions,
      difficultyCounts,
      priorityCounts,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };
  });

  return {
    banks,
  };
}

async function getQuestionById(id: string) {
  const question = await prisma.question.findUnique({
    where: {
      id,
    },
    include: {
      subject: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!question) {
    throw new AdminServiceError("Soal tidak ditemukan", 404);
  }

  return {
    question,
  };
}

async function createQuestion(
  input: AdminQuestionInput,
  imageFile: QuestionImageFile | null,
) {
  let uploadedImage: UploadedQuestionImage | null = null;

  try {
    const subject = await validateSubjectExists(input.subjectId);

    if (!subject) {
      throw new AdminServiceError("Mata pelajaran tidak ditemukan", 404);
    }

    const cleanedImageAltText = cleanOptionalText(input.imageAltText);

    if (imageFile && !cleanedImageAltText) {
      throw new AdminServiceError(
        "Deskripsi gambar wajib diisi jika gambar digunakan.",
        400,
      );
    }

    if (imageFile) {
      uploadedImage = await uploadQuestionImage(imageFile, input.subjectId);
    }

    const imageAltText = uploadedImage ? cleanedImageAltText : null;

    const difficulty = classifyQuestionDifficulty({
      questionText: input.questionText,
      imageAltText,
      hasImage: Boolean(uploadedImage),
    });

    const weight = getWeightFromPriority(input.weightPriority);

    const question = await prisma.question.create({
      data: {
        subjectId: input.subjectId,
        ownerId: subject.ownerId,

        questionText: input.questionText,

        imageUrl: uploadedImage?.imageUrl ?? null,
        imagePath: uploadedImage?.imagePath ?? null,
        imageAltText,

        optionA: input.optionA,
        optionB: input.optionB,
        optionC: input.optionC,
        optionD: input.optionD,

        correctAnswer: input.correctAnswer,

        difficultyLevel: difficulty.difficultyLevel,
        difficultyScore: difficulty.difficultyScore,
        detectedIndicators:
          difficulty.detectedIndicators as Prisma.InputJsonValue,

        weightPriority: input.weightPriority,
        weight,
      },
      include: {
        subject: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      question,
    };
  } catch (error) {
    if (uploadedImage?.imagePath) {
      await deleteQuestionImage(uploadedImage.imagePath);
    }

    if (error instanceof AdminServiceError) {
      throw error;
    }

    throw new AdminServiceError(getErrorMessage(error), 400);
  }
}

async function updateQuestion(
  id: string,
  input: AdminQuestionInput,
  imageFile: QuestionImageFile | null,
) {
  let uploadedImage: UploadedQuestionImage | null = null;

  try {
    const existingQuestion = await prisma.question.findUnique({
      where: {
        id,
      },
    });

    if (!existingQuestion) {
      throw new AdminServiceError("Soal tidak ditemukan", 404);
    }

    const subject = await validateSubjectExists(input.subjectId);

    if (!subject) {
      throw new AdminServiceError("Mata pelajaran tidak ditemukan", 404);
    }

    const willHaveImage = Boolean(
      imageFile || (!input.removeImage && existingQuestion.imageUrl),
    );

    const cleanedImageAltText = cleanOptionalText(input.imageAltText);

    if (willHaveImage && !cleanedImageAltText) {
      throw new AdminServiceError(
        "Deskripsi gambar wajib diisi jika gambar digunakan.",
        400,
      );
    }

    if (imageFile) {
      uploadedImage = await uploadQuestionImage(imageFile, input.subjectId);
    }

    const imageAltText = willHaveImage ? cleanedImageAltText : null;

    const difficulty = classifyQuestionDifficulty({
      questionText: input.questionText,
      imageAltText,
      hasImage: willHaveImage,
    });

    const weight = getWeightFromPriority(input.weightPriority);

    const shouldDeleteOldImage = Boolean(
      existingQuestion.imagePath && (uploadedImage || input.removeImage),
    );

    const question = await prisma.question.update({
      where: {
        id,
      },
      data: {
        subjectId: input.subjectId,
        ownerId: subject.ownerId,

        questionText: input.questionText,

        ...(uploadedImage
          ? {
              imageUrl: uploadedImage.imageUrl,
              imagePath: uploadedImage.imagePath,
              imageAltText,
            }
          : input.removeImage
            ? {
                imageUrl: null,
                imagePath: null,
                imageAltText: null,
              }
            : {
                imageAltText,
              }),

        optionA: input.optionA,
        optionB: input.optionB,
        optionC: input.optionC,
        optionD: input.optionD,

        correctAnswer: input.correctAnswer,

        difficultyLevel: difficulty.difficultyLevel,
        difficultyScore: difficulty.difficultyScore,
        detectedIndicators:
          difficulty.detectedIndicators as Prisma.InputJsonValue,

        weightPriority: input.weightPriority,
        weight,
      },
      include: {
        subject: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (shouldDeleteOldImage && existingQuestion.imagePath) {
      await deleteQuestionImage(existingQuestion.imagePath);
    }

    return {
      question,
    };
  } catch (error) {
    if (uploadedImage?.imagePath) {
      await deleteQuestionImage(uploadedImage.imagePath);
    }

    if (error instanceof AdminServiceError) {
      throw error;
    }

    throw new AdminServiceError(getErrorMessage(error), 400);
  }
}

async function deleteQuestion(id: string) {
  const existingQuestion = await prisma.question.findUnique({
    where: {
      id,
    },
  });

  if (!existingQuestion) {
    throw new AdminServiceError("Soal tidak ditemukan", 404);
  }

  await prisma.question.delete({
    where: {
      id,
    },
  });

  await deleteQuestionImage(existingQuestion.imagePath);

  return null;
}

async function getTryouts(query: { status?: string; ownerId?: string }) {
  const where: Prisma.TryoutWhereInput = {
    ...(query.status && tryoutStatuses.includes(query.status as never)
      ? {
          status: query.status as "DRAFT" | "OPEN" | "CLOSED",
        }
      : {}),

    ...(query.ownerId
      ? {
          ownerId: query.ownerId === "none" ? null : query.ownerId,
        }
      : {}),
  };

  const tryouts = await prisma.tryout.findMany({
    where,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
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

  return {
    tryouts: tryouts.map((tryout) => ({
      id: tryout.id,
      subjectId: tryout.subjectId,
      ownerId: tryout.ownerId,
      owner: tryout.owner,
      title: tryout.title,
      totalQuestions: tryout.totalQuestions,
      durationMinutes: tryout.durationMinutes,
      maxAttempts: tryout.maxAttempts,
      status: tryout.status,
      createdAt: tryout.createdAt,
      updatedAt: tryout.updatedAt,
      bank: {
        id: tryout.subject.id,
        name: tryout.subject.name,
        totalAvailableQuestions: tryout.subject._count.questions,
      },
      totalSessions: tryout._count.sessions,
    })),
  };
}

async function getTryoutById(id: string) {
  const tryout = await prisma.tryout.findUnique({
    where: {
      id,
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
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
    throw new AdminServiceError("Tryout tidak ditemukan", 404);
  }

  return {
    tryout: {
      id: tryout.id,
      subjectId: tryout.subjectId,
      ownerId: tryout.ownerId,
      owner: tryout.owner,
      title: tryout.title,
      totalQuestions: tryout.totalQuestions,
      durationMinutes: tryout.durationMinutes,
      maxAttempts: tryout.maxAttempts,
      status: tryout.status,
      createdAt: tryout.createdAt,
      updatedAt: tryout.updatedAt,
      bank: {
        id: tryout.subject.id,
        name: tryout.subject.name,
        totalAvailableQuestions: tryout.subject._count.questions,
      },
      totalSessions: tryout._count.sessions,
    },
  };
}

async function createTryout(input: AdminTryoutInput) {
  const validation = await validateTryoutQuestionAvailability(
    input.subjectId,
    input.totalQuestions,
  );

  if (!validation.ok) {
    throw new AdminServiceError(validation.message, 400);
  }

  const tryout = await prisma.tryout.create({
    data: {
      subjectId: input.subjectId,
      ownerId: validation.subject.ownerId,
      title: input.title,
      totalQuestions: input.totalQuestions,
      durationMinutes: input.durationMinutes,
      maxAttempts: input.maxAttempts,
      status: input.status,
    },
    include: {
      subject: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return {
    tryout,
  };
}

async function updateTryout(id: string, input: AdminTryoutInput) {
  const existingTryout = await prisma.tryout.findUnique({
    where: {
      id,
    },
  });

  if (!existingTryout) {
    throw new AdminServiceError("Tryout tidak ditemukan", 404);
  }

  const validation = await validateTryoutQuestionAvailability(
    input.subjectId,
    input.totalQuestions,
  );

  if (!validation.ok) {
    throw new AdminServiceError(validation.message, 400);
  }

  const tryout = await prisma.tryout.update({
    where: {
      id,
    },
    data: {
      subjectId: input.subjectId,
      ownerId: validation.subject.ownerId,
      title: input.title,
      totalQuestions: input.totalQuestions,
      durationMinutes: input.durationMinutes,
      maxAttempts: input.maxAttempts,
      status: input.status,
    },
    include: {
      subject: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return {
    tryout,
  };
}

async function updateTryoutStatus(id: string, input: AdminTryoutStatusInput) {
  const existingTryout = await prisma.tryout.findUnique({
    where: {
      id,
    },
  });

  if (!existingTryout) {
    throw new AdminServiceError("Tryout tidak ditemukan", 404);
  }

  const tryout = await prisma.tryout.update({
    where: {
      id,
    },
    data: {
      status: input.status,
    },
  });

  return {
    tryout,
  };
}

async function deleteTryout(id: string) {
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
    throw new AdminServiceError("Tryout tidak ditemukan", 404);
  }

  if (existingTryout._count.sessions > 0) {
    throw new AdminServiceError(
      "Tryout tidak dapat dihapus karena sudah memiliki sesi pengerjaan siswa",
      400,
    );
  }

  await prisma.tryout.delete({
    where: {
      id,
    },
  });

  return null;
}

async function getTryoutResults(id: string) {
  const tryout = await prisma.tryout.findUnique({
    where: {
      id,
    },
  });

  if (!tryout) {
    throw new AdminServiceError("Tryout tidak ditemukan", 404);
  }

  const sessions = await prisma.tryoutSession.findMany({
    where: {
      tryoutId: id,
    },
    include: {
      user: true,
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

  return {
    sessions: sessions.map((session) => ({
      id: session.id,
      attemptNumber: session.attemptNumber,
      score: session.score,
      correctCount: session.correctCount,
      wrongCount: session.wrongCount,
      totalQuestions: session.totalQuestions,
      status: session.status,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
      answeredCount: session._count.answers,
      student: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        school: session.user.school,
        className: session.user.className,
      },
      tryout: {
        id: session.tryout.id,
        title: session.tryout.title,
        bankName: session.tryout.subject.name,
      },
    })),
  };
}

async function getTryoutStatistics(id: string) {
  const tryout = await prisma.tryout.findUnique({
    where: {
      id,
    },
  });

  if (!tryout) {
    throw new AdminServiceError("Tryout tidak ditemukan", 404);
  }

  const sessions = await prisma.tryoutSession.findMany({
    where: {
      tryoutId: id,
    },
    include: {
      user: true,
    },
    orderBy: [
      {
        attemptNumber: "asc",
      },
      {
        startedAt: "asc",
      },
    ],
  });

  const finishedSessions = sessions.filter(
    (session) => session.status === "FINISHED",
  );

  const scores = finishedSessions.map((session) => session.score);

  const totalStudents = new Set(sessions.map((session) => session.userId)).size;

  const averageScore = calculateAverageScore(scores);

  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  const completionRate =
    sessions.length > 0
      ? Math.round((finishedSessions.length / sessions.length) * 100)
      : 0;

  const attemptMap = new Map<
    number,
    {
      totalScore: number;
      totalSessions: number;
    }
  >();

  for (const session of finishedSessions) {
    const current = attemptMap.get(session.attemptNumber) ?? {
      totalScore: 0,
      totalSessions: 0,
    };

    current.totalScore += session.score;
    current.totalSessions += 1;

    attemptMap.set(session.attemptNumber, current);
  }

  const attemptTrend = Array.from(attemptMap.entries()).map(
    ([attemptNumber, value]) => ({
      attemptNumber,
      averageScore: Math.round(value.totalScore / value.totalSessions),
      totalSessions: value.totalSessions,
    }),
  );

  const studentMap = new Map<
    string,
    {
      studentId: string;
      name: string;
      email: string;
      scores: {
        attemptNumber: number;
        score: number;
        status: string;
        startedAt: Date;
        finishedAt: Date | null;
      }[];
    }
  >();

  for (const session of sessions) {
    const existing = studentMap.get(session.userId) ?? {
      studentId: session.userId,
      name: session.user.name,
      email: session.user.email,
      scores: [],
    };

    existing.scores.push({
      attemptNumber: session.attemptNumber,
      score: session.score,
      status: session.status,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,
    });

    studentMap.set(session.userId, existing);
  }

  return {
    summary: {
      totalStudents,
      totalSessions: sessions.length,
      finishedSessions: finishedSessions.length,
      averageScore,
      highestScore,
      lowestScore,
      completionRate,
    },
    attemptTrend,
    studentProgress: Array.from(studentMap.values()),
  };
}

export default {
  getSubjects,
  createSubject,

  analyzeQuestion,
  getQuestions,
  getQuestionBanks,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,

  getTryouts,
  getTryoutById,
  createTryout,
  updateTryout,
  updateTryoutStatus,
  deleteTryout,

  getTryoutResults,
  getTryoutStatistics,
};

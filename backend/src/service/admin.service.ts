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
import type {
  DifficultyLevel,
  EnrollmentStatus,
  WeightPriority,
} from "../types/domain.js";
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

const ownerSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
} as const satisfies Prisma.UserSelect;

const enrollmentStudentSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  school: true,
  className: true,
  createdAt: true,
  updatedAt: true,
} as const satisfies Prisma.UserSelect;

const enrollmentInclude = {
  student: {
    select: enrollmentStudentSelect,
  },
  tryout: {
    select: {
      id: true,
      title: true,
      ownerId: true,
      owner: {
        select: ownerSelect,
      },
    },
  },
} as const satisfies Prisma.TryoutEnrollmentInclude;

type EnrollmentWithStudent = Prisma.TryoutEnrollmentGetPayload<{
  include: typeof enrollmentInclude;
}>;

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

function calculateAverage(values: number[]) {
  if (values.length === 0) {
    return 0;
  }

  return Math.round(
    values.reduce((total, value) => total + value, 0) / values.length,
  );
}

function toEnrollmentPayload(enrollment: EnrollmentWithStudent) {
  return {
    id: enrollment.id,
    tryoutId: enrollment.tryoutId,
    studentId: enrollment.studentId,
    status: enrollment.status as EnrollmentStatus,
    requestedAt: enrollment.requestedAt,
    approvedAt: enrollment.approvedAt,
    rejectedAt: enrollment.rejectedAt,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
    student: enrollment.student,
    tryout: enrollment.tryout,
  };
}

async function validateOwnerForAdmin(
  currentAdminId: string,
  ownerId?: string | null,
) {
  const cleanedOwnerId = cleanOptionalText(ownerId);

  if (!cleanedOwnerId) {
    return {
      ok: true as const,
      ownerId: currentAdminId,
    };
  }

  if (cleanedOwnerId === "none") {
    return {
      ok: true as const,
      ownerId: null,
    };
  }

  const owner = await prisma.user.findFirst({
    where: {
      id: cleanedOwnerId,
      role: {
        in: ["ADMIN", "TEACHER"],
      },
    },
    select: {
      id: true,
    },
  });

  if (!owner) {
    return {
      ok: false as const,
      message: "Owner tidak ditemukan",
    };
  }

  return {
    ok: true as const,
    ownerId: owner.id,
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

async function assertTryoutExists(id: string) {
  const tryout = await prisma.tryout.findUnique({
    where: {
      id,
    },
  });

  if (!tryout) {
    throw new AdminServiceError("Tryout tidak ditemukan", 404);
  }

  return tryout;
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
        select: ownerSelect,
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

async function createSubject(currentAdminId: string, input: AdminSubjectInput) {
  const ownerValidation = await validateOwnerForAdmin(
    currentAdminId,
    input.ownerId,
  );

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
      include: {
        owner: {
          select: ownerSelect,
        },
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
        select: ownerSelect,
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
        select: ownerSelect,
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
    orderBy: [
      {
        ownerId: "asc",
      },
      {
        name: "asc",
      },
    ],
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
        select: ownerSelect,
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
          select: ownerSelect,
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
          select: ownerSelect,
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
        select: ownerSelect,
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
      enrollments: {
        select: {
          status: true,
        },
      },
      _count: {
        select: {
          sessions: true,
          enrollments: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    tryouts: tryouts.map((tryout) => {
      const totalParticipants = tryout.enrollments.filter(
        (enrollment) => enrollment.status === "APPROVED",
      ).length;

      const pendingRequests = tryout.enrollments.filter(
        (enrollment) => enrollment.status === "PENDING",
      ).length;

      const rejectedParticipants = tryout.enrollments.filter(
        (enrollment) => enrollment.status === "REJECTED",
      ).length;

      return {
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
        totalEnrollments: tryout._count.enrollments,
        totalParticipants,
        pendingRequests,
        rejectedParticipants,
      };
    }),
  };
}

async function getTryoutById(id: string) {
  const tryout = await prisma.tryout.findUnique({
    where: {
      id,
    },
    include: {
      owner: {
        select: ownerSelect,
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
      enrollments: {
        select: {
          status: true,
        },
      },
      _count: {
        select: {
          sessions: true,
          enrollments: true,
        },
      },
    },
  });

  if (!tryout) {
    throw new AdminServiceError("Tryout tidak ditemukan", 404);
  }

  const totalParticipants = tryout.enrollments.filter(
    (enrollment) => enrollment.status === "APPROVED",
  ).length;

  const pendingRequests = tryout.enrollments.filter(
    (enrollment) => enrollment.status === "PENDING",
  ).length;

  const rejectedParticipants = tryout.enrollments.filter(
    (enrollment) => enrollment.status === "REJECTED",
  ).length;

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
      totalEnrollments: tryout._count.enrollments,
      totalParticipants,
      pendingRequests,
      rejectedParticipants,
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
        select: ownerSelect,
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
        select: ownerSelect,
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
          enrollments: true,
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

  if (existingTryout._count.enrollments > 0) {
    throw new AdminServiceError(
      "Tryout tidak dapat dihapus karena sudah memiliki daftar peserta",
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

async function getTryoutParticipants(id: string) {
  const tryout = await assertTryoutExists(id);

  const enrollments = await prisma.tryoutEnrollment.findMany({
    where: {
      tryoutId: tryout.id,
    },
    include: {
      student: {
        select: {
          ...enrollmentStudentSelect,
          sessions: {
            where: {
              tryoutId: tryout.id,
            },
            select: {
              id: true,
              attemptNumber: true,
              score: true,
              correctCount: true,
              wrongCount: true,
              totalQuestions: true,
              status: true,
              startedAt: true,
              finishedAt: true,
              _count: {
                select: {
                  answers: true,
                },
              },
            },
            orderBy: [
              {
                attemptNumber: "asc",
              },
              {
                startedAt: "asc",
              },
            ],
          },
        },
      },
    },
    orderBy: [
      {
        status: "asc",
      },
      {
        createdAt: "desc",
      },
    ],
  });

  const participants = enrollments.map((enrollment) => ({
    id: enrollment.id,
    tryoutId: enrollment.tryoutId,
    studentId: enrollment.studentId,
    status: enrollment.status as EnrollmentStatus,
    requestedAt: enrollment.requestedAt,
    approvedAt: enrollment.approvedAt,
    rejectedAt: enrollment.rejectedAt,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
    student: {
      id: enrollment.student.id,
      name: enrollment.student.name,
      email: enrollment.student.email,
      role: enrollment.student.role,
      school: enrollment.student.school,
      className: enrollment.student.className,
      createdAt: enrollment.student.createdAt,
      updatedAt: enrollment.student.updatedAt,
    },
    attempts: enrollment.student.sessions.map((session) => ({
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
    })),
  }));

  return {
    tryout: {
      id: tryout.id,
      title: tryout.title,
      maxAttempts: tryout.maxAttempts,
      status: tryout.status,
    },
    summary: {
      totalParticipants: participants.filter(
        (participant) => participant.status === "APPROVED",
      ).length,
      pendingRequests: participants.filter(
        (participant) => participant.status === "PENDING",
      ).length,
      rejectedParticipants: participants.filter(
        (participant) => participant.status === "REJECTED",
      ).length,
      totalEnrollments: participants.length,
    },
    participants,
  };
}

async function enrollStudent(tryoutId: string, studentId: string) {
  const tryout = await assertTryoutExists(tryoutId);

  const student = await prisma.user.findFirst({
    where: {
      id: studentId,
      role: "STUDENT",
    },
    select: {
      id: true,
    },
  });

  if (!student) {
    throw new AdminServiceError("Siswa tidak ditemukan", 404);
  }

  const existingEnrollment = await prisma.tryoutEnrollment.findUnique({
    where: {
      tryoutId_studentId: {
        tryoutId: tryout.id,
        studentId: student.id,
      },
    },
    include: enrollmentInclude,
  });

  if (existingEnrollment?.status === "APPROVED") {
    return {
      created: false,
      message: "Siswa sudah menjadi peserta tryout ini.",
      enrollment: toEnrollmentPayload(existingEnrollment),
    };
  }

  if (existingEnrollment) {
    const enrollment = await prisma.tryoutEnrollment.update({
      where: {
        id: existingEnrollment.id,
      },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        rejectedAt: null,
      },
      include: enrollmentInclude,
    });

    return {
      created: false,
      message: "Siswa berhasil dimasukkan sebagai peserta tryout.",
      enrollment: toEnrollmentPayload(enrollment),
    };
  }

  const enrollment = await prisma.tryoutEnrollment.create({
    data: {
      tryoutId: tryout.id,
      studentId: student.id,
      status: "APPROVED",
      approvedAt: new Date(),
      rejectedAt: null,
    },
    include: enrollmentInclude,
  });

  return {
    created: true,
    message: "Siswa berhasil dimasukkan sebagai peserta tryout.",
    enrollment: toEnrollmentPayload(enrollment),
  };
}

async function approveEnrollment(enrollmentId: string) {
  const existingEnrollment = await prisma.tryoutEnrollment.findUnique({
    where: {
      id: enrollmentId,
    },
    include: enrollmentInclude,
  });

  if (!existingEnrollment) {
    throw new AdminServiceError("Data peserta tidak ditemukan", 404);
  }

  if (existingEnrollment.status === "APPROVED") {
    return {
      message: "Peserta sudah disetujui.",
      enrollment: toEnrollmentPayload(existingEnrollment),
    };
  }

  const enrollment = await prisma.tryoutEnrollment.update({
    where: {
      id: existingEnrollment.id,
    },
    data: {
      status: "APPROVED",
      approvedAt: new Date(),
      rejectedAt: null,
    },
    include: enrollmentInclude,
  });

  return {
    message: "Peserta berhasil disetujui.",
    enrollment: toEnrollmentPayload(enrollment),
  };
}

async function rejectEnrollment(enrollmentId: string) {
  const existingEnrollment = await prisma.tryoutEnrollment.findUnique({
    where: {
      id: enrollmentId,
    },
    include: enrollmentInclude,
  });

  if (!existingEnrollment) {
    throw new AdminServiceError("Data peserta tidak ditemukan", 404);
  }

  if (existingEnrollment.status === "REJECTED") {
    return {
      message: "Peserta sudah ditolak.",
      enrollment: toEnrollmentPayload(existingEnrollment),
    };
  }

  const enrollment = await prisma.tryoutEnrollment.update({
    where: {
      id: existingEnrollment.id,
    },
    data: {
      status: "REJECTED",
      approvedAt: null,
      rejectedAt: new Date(),
    },
    include: enrollmentInclude,
  });

  return {
    message: "Peserta berhasil ditolak.",
    enrollment: toEnrollmentPayload(enrollment),
  };
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

  const approvedEnrollments = await prisma.tryoutEnrollment.findMany({
    where: {
      tryoutId: id,
      status: "APPROVED",
    },
    select: {
      studentId: true,
    },
  });

  const approvedStudentIds = approvedEnrollments.map(
    (enrollment) => enrollment.studentId,
  );

  const sessions = await prisma.tryoutSession.findMany({
    where: {
      tryoutId: id,
      userId: {
        in: approvedStudentIds,
      },
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
    include: {
      subject: true,
    },
  });

  if (!tryout) {
    throw new AdminServiceError("Tryout tidak ditemukan", 404);
  }

  const enrollments = await prisma.tryoutEnrollment.findMany({
    where: {
      tryoutId: id,
    },
    include: {
      student: {
        select: enrollmentStudentSelect,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const approvedEnrollments = enrollments.filter(
    (enrollment) => enrollment.status === "APPROVED",
  );

  const approvedStudentIds = approvedEnrollments.map(
    (enrollment) => enrollment.studentId,
  );

  const sessions =
    approvedStudentIds.length > 0
      ? await prisma.tryoutSession.findMany({
          where: {
            tryoutId: id,
            userId: {
              in: approvedStudentIds,
            },
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
        })
      : [];

  const finishedSessions = sessions.filter(
    (session) => session.status === "FINISHED",
  );

  const scores = finishedSessions.map((session) => session.score);

  const totalParticipants = approvedEnrollments.length;
  const pendingRequests = enrollments.filter(
    (enrollment) => enrollment.status === "PENDING",
  ).length;
  const rejectedParticipants = enrollments.filter(
    (enrollment) => enrollment.status === "REJECTED",
  ).length;

  const totalStudentsWithSession = new Set(
    sessions.map((session) => session.userId),
  ).size;

  const finishedStudentIds = new Set(
    finishedSessions.map((session) => session.userId),
  );

  const averageScore = calculateAverageScore(scores);

  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

  const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

  const completionRate =
    totalParticipants > 0
      ? Math.round((finishedStudentIds.size / totalParticipants) * 100)
      : 0;

  const attemptMap = new Map<
    number,
    {
      scores: number[];
      correctCounts: number[];
      wrongCounts: number[];
      totalFinishedSessions: number;
    }
  >();

  for (const session of finishedSessions) {
    const current = attemptMap.get(session.attemptNumber) ?? {
      scores: [],
      correctCounts: [],
      wrongCounts: [],
      totalFinishedSessions: 0,
    };

    current.scores.push(session.score);
    current.correctCounts.push(session.correctCount);
    current.wrongCounts.push(session.wrongCount);
    current.totalFinishedSessions += 1;

    attemptMap.set(session.attemptNumber, current);
  }

  const progressCurve = Array.from(attemptMap.entries())
    .map(([attemptNumber, value]) => ({
      attemptNumber,
      totalFinishedSessions: value.totalFinishedSessions,
      averageScore: calculateAverage(value.scores),
      averageCorrect: calculateAverage(value.correctCounts),
      averageWrong: calculateAverage(value.wrongCounts),
      completionRate:
        totalParticipants > 0
          ? Math.round((value.totalFinishedSessions / totalParticipants) * 100)
          : 0,
    }))
    .sort((a, b) => a.attemptNumber - b.attemptNumber);

  const attemptTrend = progressCurve.map((item) => ({
    attemptNumber: item.attemptNumber,
    averageScore: item.averageScore,
    totalSessions: item.totalFinishedSessions,
  }));

  const latestScoreByStudent = new Map<string, number>();

  for (const session of finishedSessions) {
    latestScoreByStudent.set(session.userId, session.score);
  }

  const latestScores = Array.from(latestScoreByStudent.values());

  const averageLatestScore = calculateAverageScore(latestScores);

  let trend: "IMPROVING" | "DECLINING" | "STABLE" | "NO_DATA" = "NO_DATA";

  if (progressCurve.length >= 2) {
    const firstAverage = progressCurve[0]?.averageScore ?? 0;
    const lastAverage =
      progressCurve[progressCurve.length - 1]?.averageScore ?? 0;
    const diff = lastAverage - firstAverage;

    if (diff >= 5) {
      trend = "IMPROVING";
    } else if (diff <= -5) {
      trend = "DECLINING";
    } else {
      trend = "STABLE";
    }
  } else if (progressCurve.length === 1) {
    trend = "STABLE";
  }

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
    tryout: {
      id: tryout.id,
      title: tryout.title,
      bankName: tryout.subject.name,
      maxAttempts: tryout.maxAttempts,
      totalQuestions: tryout.totalQuestions,
      durationMinutes: tryout.durationMinutes,
      status: tryout.status,
    },
    summary: {
      totalParticipants,
      pendingRequests,
      rejectedParticipants,
      totalStudents: totalParticipants,
      totalStudentsWithSession,
      totalSessions: sessions.length,
      finishedSessions: finishedSessions.length,
      totalFinishedParticipants: finishedStudentIds.size,
      averageScore,
      averageLatestScore,
      highestScore,
      lowestScore,
      completionRate,
      trend,
    },
    progressCurve,
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

  getTryoutParticipants,
  enrollStudent,
  approveEnrollment,
  rejectEnrollment,

  getTryoutResults,
  getTryoutStatistics,
};

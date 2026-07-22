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
  type TeacherAnalyzeQuestionInput,
  type TeacherQuestionInput,
  type TeacherSubjectInput,
  type TeacherTryoutInput,
  type TeacherTryoutStatusInput,
} from "../schema/teacher.schema.js";

export class TeacherServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

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
    },
  },
} as const satisfies Prisma.TryoutEnrollmentInclude;

type EnrollmentWithStudent = Prisma.TryoutEnrollmentGetPayload<{
  include: typeof enrollmentInclude;
}>;

function cleanOptionalText(value?: string | null) {
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

async function getOwnedSubject(subjectId: string, teacherId: string) {
  return prisma.subject.findFirst({
    where: {
      id: subjectId,
      ownerId: teacherId,
    },
    select: {
      id: true,
      ownerId: true,
    },
  });
}

async function getOwnedTryout(tryoutId: string, teacherId: string) {
  return prisma.tryout.findFirst({
    where: {
      id: tryoutId,
      ownerId: teacherId,
    },
  });
}

async function assertOwnedTryout(tryoutId: string, teacherId: string) {
  const tryout = await getOwnedTryout(tryoutId, teacherId);

  if (!tryout) {
    throw new TeacherServiceError("Tryout tidak ditemukan", 404);
  }

  return tryout;
}

async function validateTryoutQuestionAvailability(
  subjectId: string,
  teacherId: string,
  totalQuestions: number,
) {
  const subject = await prisma.subject.findFirst({
    where: {
      id: subjectId,
      ownerId: teacherId,
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

async function getSubjects(teacherId: string) {
  const subjects = await prisma.subject.findMany({
    where: {
      ownerId: teacherId,
    },
    include: {
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
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
      totalAvailableQuestions: subject._count.questions,
    })),
  };
}

async function createSubject(teacherId: string, input: TeacherSubjectInput) {
  const existingSubject = await prisma.subject.findFirst({
    where: {
      name: input.name,
      ownerId: teacherId,
    },
  });

  const subject =
    existingSubject ??
    (await prisma.subject.create({
      data: {
        name: input.name,
        ownerId: teacherId,
      },
    }));

  return {
    subject,
  };
}

function analyzeQuestion(input: TeacherAnalyzeQuestionInput) {
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

async function getQuestions(
  teacherId: string,
  query: {
    search?: string;
    subjectId?: string;
    difficultyLevel?: DifficultyLevel;
    weightPriority?: WeightPriority;
  },
) {
  const filters: Prisma.QuestionWhereInput[] = [
    {
      ownerId: teacherId,
    },
  ];

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

  const questions = await prisma.question.findMany({
    where: {
      AND: filters,
    },
    include: {
      subject: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    questions,
  };
}

async function getQuestionById(teacherId: string, id: string) {
  const question = await prisma.question.findFirst({
    where: {
      id,
      ownerId: teacherId,
    },
    include: {
      subject: true,
    },
  });

  if (!question) {
    throw new TeacherServiceError("Soal tidak ditemukan", 404);
  }

  return {
    question,
  };
}

async function createQuestion(
  teacherId: string,
  input: TeacherQuestionInput,
  imageFile: QuestionImageFile | null,
) {
  let uploadedImage: UploadedQuestionImage | null = null;

  try {
    const subject = await getOwnedSubject(input.subjectId, teacherId);

    if (!subject) {
      throw new TeacherServiceError("Bank soal tidak ditemukan", 404);
    }

    const cleanedImageAltText = cleanOptionalText(input.imageAltText);

    if (imageFile && !cleanedImageAltText) {
      throw new TeacherServiceError(
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
        ownerId: teacherId,

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
      },
    });

    return {
      question,
    };
  } catch (error) {
    if (uploadedImage?.imagePath) {
      await deleteQuestionImage(uploadedImage.imagePath);
    }

    if (error instanceof TeacherServiceError) {
      throw error;
    }

    throw new TeacherServiceError(getErrorMessage(error), 400);
  }
}

async function updateQuestion(
  teacherId: string,
  id: string,
  input: TeacherQuestionInput,
  imageFile: QuestionImageFile | null,
) {
  let uploadedImage: UploadedQuestionImage | null = null;

  try {
    const existingQuestion = await prisma.question.findFirst({
      where: {
        id,
        ownerId: teacherId,
      },
    });

    if (!existingQuestion) {
      throw new TeacherServiceError("Soal tidak ditemukan", 404);
    }

    const subject = await getOwnedSubject(input.subjectId, teacherId);

    if (!subject) {
      throw new TeacherServiceError("Bank soal tidak ditemukan", 404);
    }

    const willHaveImage = Boolean(
      imageFile || (!input.removeImage && existingQuestion.imageUrl),
    );

    const cleanedImageAltText = cleanOptionalText(input.imageAltText);

    if (willHaveImage && !cleanedImageAltText) {
      throw new TeacherServiceError(
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
        ownerId: teacherId,

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

    if (error instanceof TeacherServiceError) {
      throw error;
    }

    throw new TeacherServiceError(getErrorMessage(error), 400);
  }
}

async function deleteQuestion(teacherId: string, id: string) {
  const existingQuestion = await prisma.question.findFirst({
    where: {
      id,
      ownerId: teacherId,
    },
  });

  if (!existingQuestion) {
    throw new TeacherServiceError("Soal tidak ditemukan", 404);
  }

  await prisma.question.delete({
    where: {
      id,
    },
  });

  await deleteQuestionImage(existingQuestion.imagePath);

  return null;
}

async function getQuestionBanks(teacherId: string) {
  const subjects = await prisma.subject.findMany({
    where: {
      ownerId: teacherId,
    },
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
      difficultyCounts[question.difficultyLevel as DifficultyLevel] += 1;
      priorityCounts[question.weightPriority as WeightPriority] += 1;
    }

    return {
      id: subject.id,
      name: subject.name,
      ownerId: subject.ownerId,
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

async function getTryouts(teacherId: string) {
  const tryouts = await prisma.tryout.findMany({
    where: {
      ownerId: teacherId,
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
        title: tryout.title,
        totalQuestions: tryout.totalQuestions,
        durationMinutes: tryout.durationMinutes,
        maxAttempts: tryout.maxAttempts,
        status: tryout.status,
        createdAt: tryout.createdAt,
        updatedAt: tryout.updatedAt,
        totalSessions: tryout._count.sessions,
        totalEnrollments: tryout._count.enrollments,
        totalParticipants,
        pendingRequests,
        rejectedParticipants,
        bank: {
          id: tryout.subject.id,
          name: tryout.subject.name,
          totalAvailableQuestions: tryout.subject._count.questions,
        },
      };
    }),
  };
}

async function getTryoutById(teacherId: string, id: string) {
  const tryout = await prisma.tryout.findFirst({
    where: {
      id,
      ownerId: teacherId,
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
    throw new TeacherServiceError("Tryout tidak ditemukan", 404);
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
      title: tryout.title,
      totalQuestions: tryout.totalQuestions,
      durationMinutes: tryout.durationMinutes,
      maxAttempts: tryout.maxAttempts,
      status: tryout.status,
      createdAt: tryout.createdAt,
      updatedAt: tryout.updatedAt,
      totalSessions: tryout._count.sessions,
      totalEnrollments: tryout._count.enrollments,
      totalParticipants,
      pendingRequests,
      rejectedParticipants,
      bank: {
        id: tryout.subject.id,
        name: tryout.subject.name,
        totalAvailableQuestions: tryout.subject._count.questions,
      },
    },
  };
}

async function createTryout(teacherId: string, input: TeacherTryoutInput) {
  const validation = await validateTryoutQuestionAvailability(
    input.subjectId,
    teacherId,
    input.totalQuestions,
  );

  if (!validation.ok) {
    throw new TeacherServiceError(validation.message, 400);
  }

  const tryout = await prisma.tryout.create({
    data: {
      subjectId: input.subjectId,
      ownerId: teacherId,
      title: input.title,
      totalQuestions: input.totalQuestions,
      durationMinutes: input.durationMinutes,
      maxAttempts: input.maxAttempts,
      status: input.status,
    },
    include: {
      subject: true,
    },
  });

  return {
    tryout,
  };
}

async function updateTryout(
  teacherId: string,
  id: string,
  input: TeacherTryoutInput,
) {
  const existingTryout = await getOwnedTryout(id, teacherId);

  if (!existingTryout) {
    throw new TeacherServiceError("Tryout tidak ditemukan", 404);
  }

  const validation = await validateTryoutQuestionAvailability(
    input.subjectId,
    teacherId,
    input.totalQuestions,
  );

  if (!validation.ok) {
    throw new TeacherServiceError(validation.message, 400);
  }

  const tryout = await prisma.tryout.update({
    where: {
      id,
    },
    data: {
      subjectId: input.subjectId,
      ownerId: teacherId,
      title: input.title,
      totalQuestions: input.totalQuestions,
      durationMinutes: input.durationMinutes,
      maxAttempts: input.maxAttempts,
      status: input.status,
    },
    include: {
      subject: true,
    },
  });

  return {
    tryout,
  };
}

async function updateTryoutStatus(
  teacherId: string,
  id: string,
  input: TeacherTryoutStatusInput,
) {
  const existingTryout = await getOwnedTryout(id, teacherId);

  if (!existingTryout) {
    throw new TeacherServiceError("Tryout tidak ditemukan", 404);
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

async function deleteTryout(teacherId: string, id: string) {
  const existingTryout = await prisma.tryout.findFirst({
    where: {
      id,
      ownerId: teacherId,
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
    throw new TeacherServiceError("Tryout tidak ditemukan", 404);
  }

  if (existingTryout._count.sessions > 0) {
    throw new TeacherServiceError(
      "Tryout tidak dapat dihapus karena sudah memiliki sesi pengerjaan siswa",
      400,
    );
  }

  if (existingTryout._count.enrollments > 0) {
    throw new TeacherServiceError(
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

async function getTryoutParticipants(teacherId: string, id: string) {
  const tryout = await assertOwnedTryout(id, teacherId);

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

async function enrollStudent(
  teacherId: string,
  tryoutId: string,
  studentId: string,
) {
  const tryout = await assertOwnedTryout(tryoutId, teacherId);

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
    throw new TeacherServiceError("Siswa tidak ditemukan", 404);
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

async function approveEnrollment(teacherId: string, enrollmentId: string) {
  const existingEnrollment = await prisma.tryoutEnrollment.findFirst({
    where: {
      id: enrollmentId,
      tryout: {
        is: {
          ownerId: teacherId,
        },
      },
    },
    include: enrollmentInclude,
  });

  if (!existingEnrollment) {
    throw new TeacherServiceError("Data peserta tidak ditemukan", 404);
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

async function rejectEnrollment(teacherId: string, enrollmentId: string) {
  const existingEnrollment = await prisma.tryoutEnrollment.findFirst({
    where: {
      id: enrollmentId,
      tryout: {
        is: {
          ownerId: teacherId,
        },
      },
    },
    include: enrollmentInclude,
  });

  if (!existingEnrollment) {
    throw new TeacherServiceError("Data peserta tidak ditemukan", 404);
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

async function getTryoutResults(teacherId: string, id: string) {
  const tryout = await getOwnedTryout(id, teacherId);

  if (!tryout) {
    throw new TeacherServiceError("Tryout tidak ditemukan", 404);
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

async function getTryoutStatistics(teacherId: string, id: string) {
  const tryout = await prisma.tryout.findFirst({
    where: {
      id,
      ownerId: teacherId,
    },
    include: {
      subject: true,
    },
  });

  if (!tryout) {
    throw new TeacherServiceError("Tryout tidak ditemukan", 404);
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
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionBanks,

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

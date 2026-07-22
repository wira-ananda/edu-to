import "../lib/env.js";
import { prisma } from "../lib/prisma.js";
import type { AnswerOption, EnrollmentStatus } from "../types/domain.js";

const BIOLOGY_TRYOUT_TITLE = "[SEED] Tryout Biologi SMA - Admin";
const BINDO_TRYOUT_TITLE = "[SEED] Tryout Bahasa Indonesia Kelas 10 - Guru";
const PRAMUKA_TRYOUT_TITLE = "[SEED] Tryout Pramuka Boyman Bab 1-2 - Guru";

const BIOLOGY_PREFIX = "[SEED-BIOLOGI-ADMIN]";
const BINDO_PREFIX = "[SEED-BINDO-X-TEACHER]";
const PRAMUKA_PREFIX = "[SEED-PRAMUKA-BOYMAN-TEACHER]";

const answerOptions: AnswerOption[] = ["A", "B", "C", "D"];

type StudentEmail =
  | "student@test.com"
  | "student2@test.com"
  | "student3@test.com"
  | "student4@test.com"
  | "student5@test.com";

type TryoutDemoConfig = {
  title: string;
  prefix: string;
  approvedScores: Partial<Record<StudentEmail, number[]>>;
  pendingStudents: StudentEmail[];
  rejectedStudents: StudentEmail[];
};

const demoConfigs: TryoutDemoConfig[] = [
  {
    title: BIOLOGY_TRYOUT_TITLE,
    prefix: BIOLOGY_PREFIX,
    approvedScores: {
      "student@test.com": [72, 84],
      "student2@test.com": [60, 70, 78],
      "student5@test.com": [88],
    },
    pendingStudents: ["student3@test.com"],
    rejectedStudents: ["student4@test.com"],
  },
  {
    title: BINDO_TRYOUT_TITLE,
    prefix: BINDO_PREFIX,
    approvedScores: {
      "student@test.com": [80, 86],
      "student2@test.com": [65],
      "student5@test.com": [75, 82, 90],
    },
    pendingStudents: ["student3@test.com"],
    rejectedStudents: ["student4@test.com"],
  },
  {
    title: PRAMUKA_TRYOUT_TITLE,
    prefix: PRAMUKA_PREFIX,
    approvedScores: {
      "student@test.com": [70, 78],
      "student2@test.com": [68, 74],
      "student5@test.com": [85, 91],
    },
    pendingStudents: ["student3@test.com"],
    rejectedStudents: ["student4@test.com"],
  },
];

function getWrongAnswer(correctAnswer: AnswerOption, offset: number) {
  const availableAnswers = answerOptions.filter(
    (answer) => answer !== correctAnswer,
  );

  return availableAnswers[offset % availableAnswers.length] as AnswerOption;
}

function getDateDaysAgo(daysAgo: number, hour = 8) {
  const date = new Date();

  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);

  return date;
}

async function getUserByEmail(email: StudentEmail) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error(`User not found: ${email}. Run seed.ts first.`);
  }

  if (user.role !== "STUDENT") {
    throw new Error(`${email} is not a student.`);
  }

  return user;
}

async function getTryoutByTitle(title: string) {
  const tryout = await prisma.tryout.findFirst({
    where: {
      title,
    },
    include: {
      subject: true,
    },
  });

  if (!tryout) {
    throw new Error(`Tryout not found: ${title}. Run seed-questions.ts first.`);
  }

  return tryout;
}

async function getQuestionPool(
  tryoutId: string,
  subjectId: string,
  ownerId: string | null,
  prefix: string,
) {
  const questions = await prisma.question.findMany({
    where: {
      subjectId,
      ownerId,
      questionText: {
        startsWith: prefix,
      },
    },
    select: {
      id: true,
      correctAnswer: true,
    },
    orderBy: {
      questionText: "asc",
    },
  });

  const tryout = await prisma.tryout.findUnique({
    where: {
      id: tryoutId,
    },
    select: {
      totalQuestions: true,
    },
  });

  if (!tryout) {
    throw new Error("Tryout not found when checking question pool.");
  }

  if (questions.length < tryout.totalQuestions) {
    throw new Error(
      `Question pool for ${prefix} only has ${questions.length} questions, but tryout needs ${tryout.totalQuestions}.`,
    );
  }

  return questions;
}

async function resetDemoData(tryoutIds: string[]) {
  await prisma.tryoutSession.deleteMany({
    where: {
      tryoutId: {
        in: tryoutIds,
      },
    },
  });

  await prisma.tryoutEnrollment.deleteMany({
    where: {
      tryoutId: {
        in: tryoutIds,
      },
    },
  });
}

async function createEnrollment(
  tryoutId: string,
  studentId: string,
  status: EnrollmentStatus,
) {
  const now = new Date();

  return prisma.tryoutEnrollment.create({
    data: {
      tryoutId,
      studentId,
      status,
      requestedAt: now,
      approvedAt: status === "APPROVED" ? now : null,
      rejectedAt: status === "REJECTED" ? now : null,
    },
  });
}

async function createFinishedAttempt(params: {
  tryoutId: string;
  userId: string;
  attemptNumber: number;
  targetScore: number;
  totalQuestions: number;
  durationMinutes: number;
  questionPool: {
    id: string;
    correctAnswer: AnswerOption;
  }[];
  daysAgo: number;
  studentOffset: number;
}) {
  const startedAt = getDateDaysAgo(params.daysAgo, 8 + params.studentOffset);
  const finishedAt = new Date(
    startedAt.getTime() + Math.min(params.durationMinutes, 35) * 60 * 1000,
  );

  const correctCount = Math.min(
    params.totalQuestions,
    Math.max(0, Math.round((params.targetScore / 100) * params.totalQuestions)),
  );

  const wrongCount = Math.max(0, params.totalQuestions - correctCount);

  const score =
    params.totalQuestions > 0
      ? Math.round((correctCount / params.totalQuestions) * 100)
      : 0;

  const session = await prisma.tryoutSession.create({
    data: {
      userId: params.userId,
      tryoutId: params.tryoutId,
      attemptNumber: params.attemptNumber,
      initialLevel: "MEDIUM",
      currentLevel: score >= 80 ? "HIGH" : score >= 60 ? "MEDIUM" : "LOW",
      totalQuestions: params.totalQuestions,
      score,
      correctCount,
      wrongCount,
      status: "FINISHED",
      startedAt,
      finishedAt,
    },
  });

  const selectedQuestions = params.questionPool.slice(0, params.totalQuestions);

  await prisma.answers.createMany({
    data: selectedQuestions.map((question, index) => {
      const isCorrect = index < correctCount;

      return {
        sessionId: session.id,
        questionId: question.id,
        selectedAnswer: isCorrect
          ? question.correctAnswer
          : getWrongAnswer(question.correctAnswer, index),
        isCorrect,
      };
    }),
  });

  return session;
}

async function seedDemoForTryout(config: TryoutDemoConfig) {
  const tryout = await getTryoutByTitle(config.title);

  const questionPool = await getQuestionPool(
    tryout.id,
    tryout.subjectId,
    tryout.ownerId,
    config.prefix,
  );

  const approvedEntries = Object.entries(config.approvedScores) as [
    StudentEmail,
    number[],
  ][];

  for (const [studentEmail, scores] of approvedEntries) {
    const student = await getUserByEmail(studentEmail);

    await createEnrollment(tryout.id, student.id, "APPROVED");

    for (const [index, targetScore] of scores.entries()) {
      await createFinishedAttempt({
        tryoutId: tryout.id,
        userId: student.id,
        attemptNumber: index + 1,
        targetScore,
        totalQuestions: tryout.totalQuestions,
        durationMinutes: tryout.durationMinutes,
        questionPool,
        daysAgo: 10 - index,
        studentOffset: approvedEntries.findIndex(
          ([email]) => email === studentEmail,
        ),
      });
    }
  }

  for (const studentEmail of config.pendingStudents) {
    const student = await getUserByEmail(studentEmail);
    await createEnrollment(tryout.id, student.id, "PENDING");
  }

  for (const studentEmail of config.rejectedStudents) {
    const student = await getUserByEmail(studentEmail);
    await createEnrollment(tryout.id, student.id, "REJECTED");
  }

  console.log(`Seeded demo progress: ${config.title}`);
}

async function main() {
  const tryouts = await Promise.all(
    demoConfigs.map((config) => getTryoutByTitle(config.title)),
  );

  await resetDemoData(tryouts.map((tryout) => tryout.id));

  for (const config of demoConfigs) {
    await seedDemoForTryout(config);
  }

  console.log("Seed demo progress completed.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

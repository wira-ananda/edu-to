import { Prisma } from "@prisma/client";

import { prisma } from "../lib/prisma.js";

import type { TeacherQuestionComparisonQuery } from "../schema/teacher.schema.js";

import type { DifficultyLevel, WeightPriority } from "../types/domain.js";

import { TeacherServiceError } from "./teacher.service.js";

type ComparisonAnswerStatus = "CORRECT" | "WRONG" | "UNANSWERED";

const comparisonQuestionSelect = {
  id: true,
  questionText: true,

  optionA: true,
  optionB: true,
  optionC: true,
  optionD: true,

  correctAnswer: true,

  imageUrl: true,
  imageAltText: true,

  weightPriority: true,
} as const satisfies Prisma.QuestionSelect;

function createAnswerKey(sessionId: string, questionId: string): string {
  return `${sessionId}:${questionId}`;
}

function getAnswerStatus(
  answer:
    | {
        selectedAnswer: string | null;
        isCorrect: boolean;
      }
    | undefined,
): ComparisonAnswerStatus {
  if (!answer || answer.selectedAnswer === null) {
    return "UNANSWERED";
  }

  return answer.isCorrect ? "CORRECT" : "WRONG";
}

function getPriorityFromWeight(
  weight: number,
  fallbackPriority: WeightPriority,
): WeightPriority {
  const priorityMap: Record<number, WeightPriority> = {
    1: "LOW",
    3: "NORMAL",
    5: "HIGH",
    7: "VERY_HIGH",
  };

  return priorityMap[weight] ?? fallbackPriority;
}

async function getOwnedTryout(teacherId: string, tryoutId: string) {
  const tryout = await prisma.tryout.findFirst({
    where: {
      id: tryoutId,
      ownerId: teacherId,
    },

    select: {
      id: true,
      title: true,
      totalQuestions: true,
      durationMinutes: true,
      maxAttempts: true,
      status: true,

      subject: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!tryout) {
    throw new TeacherServiceError("Tryout tidak ditemukan", 404);
  }

  return tryout;
}

async function getApprovedStudentIds(tryoutId: string) {
  const enrollments = await prisma.tryoutEnrollment.findMany({
    where: {
      tryoutId,
      status: "APPROVED",
    },

    select: {
      studentId: true,
    },
  });

  return enrollments.map((enrollment) => enrollment.studentId);
}

async function getAvailableAttempts(
  tryoutId: string,
  approvedStudentIds: string[],
) {
  if (approvedStudentIds.length === 0) {
    return [];
  }

  const sessions = await prisma.tryoutSession.findMany({
    where: {
      tryoutId,

      userId: {
        in: approvedStudentIds,
      },
    },

    select: {
      attemptNumber: true,
    },

    orderBy: {
      attemptNumber: "asc",
    },
  });

  return Array.from(new Set(sessions.map((session) => session.attemptNumber)));
}

function createSessionWhere(
  tryoutId: string,
  approvedStudentIds: string[],
  query: TeacherQuestionComparisonQuery,
): Prisma.TryoutSessionWhereInput {
  const where: Prisma.TryoutSessionWhereInput = {
    tryoutId,

    userId: {
      in: approvedStudentIds,
    },
  };

  if (query.attemptNumber) {
    where.attemptNumber = query.attemptNumber;
  }

  if (query.search) {
    where.user = {
      is: {
        OR: [
          {
            name: {
              contains: query.search,
              mode: "insensitive",
            },
          },
          {
            className: {
              contains: query.search,
              mode: "insensitive",
            },
          },
        ],
      },
    };
  }

  return where;
}

async function getSelectedQuestionSessions(
  tryoutId: string,
  approvedStudentIds: string[],
  query: TeacherQuestionComparisonQuery,
) {
  return prisma.tryoutSession.findMany({
    where: createSessionWhere(tryoutId, approvedStudentIds, query),

    select: {
      id: true,
      attemptNumber: true,
      status: true,
      initialLevel: true,
      currentLevel: true,
      score: true,
      startedAt: true,
      finishedAt: true,

      user: {
        select: {
          id: true,
          name: true,
          school: true,
          className: true,
        },
      },

      wrsLogs: {
        orderBy: {
          createdAt: "asc",
        },

        skip: query.questionNumber - 1,
        take: 1,

        select: {
          id: true,
          questionId: true,
          currentLevel: true,
          candidateCount: true,
          totalWeight: true,
          randomValue: true,
          selectedQuestionWeight: true,
          selectedQuestionDifficulty: true,
          createdAt: true,

          question: {
            select: comparisonQuestionSelect,
          },
        },
      },
    },
  });
}

async function getSelectedQuestionAnswers(
  sessions: Awaited<ReturnType<typeof getSelectedQuestionSessions>>,
) {
  const uniquePairs = new Map<
    string,
    {
      sessionId: string;
      questionId: string;
    }
  >();

  for (const session of sessions) {
    const selectedLog = session.wrsLogs[0];

    if (!selectedLog) {
      continue;
    }

    const key = createAnswerKey(session.id, selectedLog.questionId);

    uniquePairs.set(key, {
      sessionId: session.id,
      questionId: selectedLog.questionId,
    });
  }

  const pairs = Array.from(uniquePairs.values());

  if (pairs.length === 0) {
    return [];
  }

  return prisma.answers.findMany({
    where: {
      OR: pairs,
    },

    select: {
      id: true,
      sessionId: true,
      questionId: true,
      selectedAnswer: true,
      isCorrect: true,
      answeredAt: true,
    },
  });
}

function createComparisonItems(
  sessions: Awaited<ReturnType<typeof getSelectedQuestionSessions>>,
  answers: Awaited<ReturnType<typeof getSelectedQuestionAnswers>>,
  questionNumber: number,
) {
  const answerMap = new Map(
    answers.map((answer) => [
      createAnswerKey(answer.sessionId, answer.questionId),
      answer,
    ]),
  );

  return sessions.map((session) => {
    const selectedLog = session.wrsLogs[0] ?? null;

    const answer = selectedLog
      ? answerMap.get(createAnswerKey(session.id, selectedLog.questionId))
      : undefined;

    const answerStatus = getAnswerStatus(answer);

    return {
      sessionId: session.id,
      attemptNumber: session.attemptNumber,
      sessionStatus: session.status,
      questionNumber,

      initialLevel: session.initialLevel as DifficultyLevel,
      finalLevel: session.currentLevel as DifficultyLevel,

      score: session.score,
      startedAt: session.startedAt,
      finishedAt: session.finishedAt,

      student: {
        id: session.user.id,
        name: session.user.name,
        school: session.user.school,
        className: session.user.className,
      },

      question: selectedLog
        ? {
            id: selectedLog.question.id,
            questionText: selectedLog.question.questionText,

            optionA: selectedLog.question.optionA,
            optionB: selectedLog.question.optionB,
            optionC: selectedLog.question.optionC,
            optionD: selectedLog.question.optionD,

            correctAnswer: selectedLog.question.correctAnswer,

            imageUrl: selectedLog.question.imageUrl,
            imageAltText: selectedLog.question.imageAltText,

            difficultyLevel:
              selectedLog.selectedQuestionDifficulty as DifficultyLevel,

            weightPriority: getPriorityFromWeight(
              selectedLog.selectedQuestionWeight,
              selectedLog.question.weightPriority as WeightPriority,
            ),

            weight: selectedLog.selectedQuestionWeight,
          }
        : null,

      selection: selectedLog
        ? {
            id: selectedLog.id,

            currentLevel: selectedLog.currentLevel as DifficultyLevel,

            candidateCount: selectedLog.candidateCount,
            totalWeight: selectedLog.totalWeight,
            randomValue: selectedLog.randomValue,

            selectedQuestionWeight: selectedLog.selectedQuestionWeight,

            selectedQuestionDifficulty:
              selectedLog.selectedQuestionDifficulty as DifficultyLevel,

            selectedAt: selectedLog.createdAt,
          }
        : null,

      answer: {
        id: answer?.id ?? null,
        selectedAnswer: answer?.selectedAnswer ?? null,
        status: answerStatus,
        isCorrect:
          answerStatus === "UNANSWERED" ? null : Boolean(answer?.isCorrect),
        answeredAt: answer?.answeredAt ?? null,
      },
    };
  });
}

function filterComparisonItems(
  items: ReturnType<typeof createComparisonItems>,
  query: TeacherQuestionComparisonQuery,
) {
  return items.filter((item) => {
    if (
      query.difficultyLevel !== "ALL" &&
      item.question?.difficultyLevel !== query.difficultyLevel
    ) {
      return false;
    }

    if (
      query.answerStatus !== "ALL" &&
      item.answer.status !== query.answerStatus
    ) {
      return false;
    }

    return true;
  });
}

function createSummary(
  items: ReturnType<typeof createComparisonItems>,
  totalSessions: number,
  totalParticipants: number,
) {
  const uniqueQuestionIds = new Set<string>();

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;

  const difficultyCounts: Record<DifficultyLevel, number> = {
    LOW: 0,
    MEDIUM: 0,
    HIGH: 0,
  };

  for (const item of items) {
    if (item.question) {
      uniqueQuestionIds.add(item.question.id);
      difficultyCounts[item.question.difficultyLevel] += 1;
    }

    if (item.answer.status === "CORRECT") {
      correctCount += 1;
    } else if (item.answer.status === "WRONG") {
      wrongCount += 1;
    } else {
      unansweredCount += 1;
    }
  }

  return {
    totalParticipants,
    totalSessions,
    displayedSessions: items.length,
    uniqueQuestions: uniqueQuestionIds.size,

    correctCount,
    wrongCount,
    unansweredCount,

    difficultyCounts,
  };
}

async function getQuestionComparison(
  teacherId: string,
  tryoutId: string,
  query: TeacherQuestionComparisonQuery,
) {
  const tryout = await getOwnedTryout(teacherId, tryoutId);

  if (query.questionNumber > tryout.totalQuestions) {
    throw new TeacherServiceError(
      `Nomor soal maksimal ${tryout.totalQuestions}.`,
      400,
    );
  }

  const approvedStudentIds = await getApprovedStudentIds(tryout.id);

  const availableAttempts = await getAvailableAttempts(
    tryout.id,
    approvedStudentIds,
  );

  if (approvedStudentIds.length === 0) {
    return {
      tryout: {
        ...tryout,
        bankName: tryout.subject.name,
      },

      filters: query,

      availableAttempts,

      summary: createSummary([], 0, 0),

      items: [],
    };
  }

  const sessions = await getSelectedQuestionSessions(
    tryout.id,
    approvedStudentIds,
    query,
  );

  const answers = await getSelectedQuestionAnswers(sessions);

  const unfilteredItems = createComparisonItems(
    sessions,
    answers,
    query.questionNumber,
  );

  const items = filterComparisonItems(unfilteredItems, query).sort(
    (firstItem, secondItem) => {
      const nameComparison = firstItem.student.name.localeCompare(
        secondItem.student.name,
        "id",
      );

      if (nameComparison !== 0) {
        return nameComparison;
      }

      return firstItem.attemptNumber - secondItem.attemptNumber;
    },
  );

  return {
    tryout: {
      id: tryout.id,
      title: tryout.title,
      totalQuestions: tryout.totalQuestions,
      durationMinutes: tryout.durationMinutes,
      maxAttempts: tryout.maxAttempts,
      status: tryout.status,
      bankName: tryout.subject.name,
    },

    filters: query,

    availableAttempts,

    summary: createSummary(items, sessions.length, approvedStudentIds.length),

    items,
  };
}

export default {
  getQuestionComparison,
};

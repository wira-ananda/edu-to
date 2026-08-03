import type {
  AnalyzeQuestionPayload,
  AnalyzeQuestionResponse,
  MutateQuestionResponse,
  Question,
  QuestionBank,
  QuestionFormData,
  QuestionsResponse,
  QuestionResponse,
  Subject,
  SubjectsResponse,
} from "./questions";
import type {
  AdminTryoutItem,
  AdminTryoutResponse,
  AdminTryoutsResponse,
  CreateTryoutPayload,
  EnrollStudentResponse,
  MutateEnrollmentResponse,
  MutateTryoutResponse,
  TryoutParticipantsResponse,
  TryoutResultsResponse,
  TryoutStatisticsResponse,
  UpdateTryoutPayload,
  UpdateTryoutStatusPayload,
} from "./admin";

export type TeacherSubject = Subject;

export type TeacherQuestion = Question;

export type TeacherQuestionBank = QuestionBank;

export type TeacherTryoutItem = AdminTryoutItem;

export type TeacherSubjectsResponse = SubjectsResponse;

export type TeacherQuestionsResponse = QuestionsResponse;

export type TeacherQuestionResponse = QuestionResponse;

export type TeacherQuestionBanksResponse = {
  ok: boolean;
  banks: TeacherQuestionBank[];
};

export type TeacherAnalyzeQuestionPayload = AnalyzeQuestionPayload;

export type TeacherAnalyzeQuestionResponse = AnalyzeQuestionResponse;

export type TeacherQuestionFormData = QuestionFormData;

export type TeacherMutateQuestionResponse = MutateQuestionResponse;

export type TeacherTryoutsResponse = AdminTryoutsResponse;

export type TeacherTryoutResponse = AdminTryoutResponse;

export type TeacherCreateTryoutPayload = CreateTryoutPayload;

export type TeacherUpdateTryoutPayload = UpdateTryoutPayload;

export type TeacherUpdateTryoutStatusPayload = UpdateTryoutStatusPayload;

export type TeacherMutateTryoutResponse = MutateTryoutResponse;

export type TeacherTryoutResultsResponse = TryoutResultsResponse;

export type TeacherTryoutStatisticsResponse = TryoutStatisticsResponse;

export type TeacherTryoutParticipantsResponse = TryoutParticipantsResponse;

export type TeacherEnrollStudentResponse = EnrollStudentResponse;

export type TeacherMutateEnrollmentResponse = MutateEnrollmentResponse;
export type TeacherComparisonDifficulty = "ALL" | "LOW" | "MEDIUM" | "HIGH";

export type TeacherComparisonAnswerStatus =
  | "ALL"
  | "CORRECT"
  | "WRONG"
  | "UNANSWERED";

export type TeacherComparisonAnswerOption = "A" | "B" | "C" | "D";

export type TeacherQuestionComparisonItem = {
  sessionId: string;
  attemptNumber: number;
  sessionStatus: "ONGOING" | "FINISHED";
  questionNumber: number;

  initialLevel: "LOW" | "MEDIUM" | "HIGH";
  finalLevel: "LOW" | "MEDIUM" | "HIGH";

  score: number;
  startedAt: string;
  finishedAt: string | null;

  student: {
    id: string;
    name: string;
    school: string | null;
    className: string | null;
  };

  question: {
    id: string;
    questionText: string;

    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;

    correctAnswer: TeacherComparisonAnswerOption;

    imageUrl: string | null;
    imageAltText: string | null;

    difficultyLevel: "LOW" | "MEDIUM" | "HIGH";

    weightPriority: "LOW" | "NORMAL" | "HIGH" | "VERY_HIGH";
    weight: number;
  } | null;

  selection: {
    id: string;

    currentLevel: "LOW" | "MEDIUM" | "HIGH";

    candidateCount: number;
    totalWeight: number;
    randomValue: number;

    selectedQuestionWeight: number;

    selectedQuestionDifficulty: "LOW" | "MEDIUM" | "HIGH";

    selectedAt: string;
  } | null;

  answer: {
    id: string | null;

    selectedAnswer: TeacherComparisonAnswerOption | null;

    status: "CORRECT" | "WRONG" | "UNANSWERED";

    isCorrect: boolean | null;

    answeredAt: string | null;
  };
};

export type TeacherQuestionComparisonResponse = {
  ok: boolean;

  tryout: {
    id: string;
    title: string;
    totalQuestions: number;
    durationMinutes: number;
    maxAttempts: number | null;
    status: "DRAFT" | "OPEN" | "CLOSED";
    bankName: string;
  };

  filters: {
    questionNumber: number;
    attemptNumber?: number;
    search: string;
    difficultyLevel: TeacherComparisonDifficulty;
    answerStatus: TeacherComparisonAnswerStatus;
  };

  availableAttempts: number[];

  summary: {
    totalParticipants: number;
    totalSessions: number;
    displayedSessions: number;
    uniqueQuestions: number;

    correctCount: number;
    wrongCount: number;
    unansweredCount: number;

    difficultyCounts: {
      LOW: number;
      MEDIUM: number;
      HIGH: number;
    };
  };

  items: TeacherQuestionComparisonItem[];
};

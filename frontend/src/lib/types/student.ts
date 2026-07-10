import type { AnswerOption, DifficultyLevel } from "$lib/types/questions";

export type StudentTryoutItem = {
  id: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
  createdAt: string;
  updatedAt: string;
  bank: {
    id: string;
    name: string;
    totalAvailableQuestions: number;
  };
};

export type StudentTryoutsResponse = {
  ok: boolean;
  tryouts: StudentTryoutItem[];
};

export type StudentSession = {
  id: string;
  initialLevel: DifficultyLevel;
  currentLevel: DifficultyLevel;
  totalQuestions: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  status: "ONGOING" | "FINISHED";
  startedAt: string;
  finishedAt: string | null;
  tryout: {
    id: string;
    title: string;
    durationMinutes: number;
    subject: {
      id: string;
      name: string;
    };
  };
  _count?: {
    answers: number;
  };
};

export type StartTryoutResponse = {
  ok: boolean;
  message: string;
  session: StudentSession;
};

export type StudentQuestion = {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  imageUrl: string | null;
  imageAltText: string | null;
  difficultyLevel: DifficultyLevel;
};

export type NextQuestionResponse = {
  ok: boolean;
  finished: boolean;
  message?: string;
  session?: {
    id: string;
    initialLevel: DifficultyLevel;
    currentLevel: DifficultyLevel;
    totalQuestions: number;
    answeredCount: number;
    correctCount: number;
    wrongCount: number;
    startedAt: string;
    durationMinutes: number;
    endsAt: string;
    serverNow: string;
  };
  question?: StudentQuestion;
};

export type SubmitAnswerResponse = {
  ok: boolean;
  message: string;
  isCorrect?: boolean;
  selectedAnswer?: AnswerOption;
  previousLevel?: DifficultyLevel;
  currentLevel?: DifficultyLevel;
  finished: boolean;
  session: StudentSession;
};

export type TimeoutSessionResponse = {
  ok: boolean;
  message: string;
  finished: boolean;
  session: StudentSession;
};

export type StudentSessionsResponse = {
  ok: boolean;
  sessions: StudentSession[];
};

export type StudentResultAnswer = {
  id: string;
  questionText: string;
  imageUrl: string | null;
  imageAltText: string | null;
  selectedAnswer: AnswerOption | null;
  correctAnswer: AnswerOption;
  isCorrect: boolean;
  answeredAt: string;
};

export type StudentResultResponse = {
  ok: boolean;
  session: {
    id: string;
    tryoutTitle: string;
    bankName: string;
    initialLevel: DifficultyLevel;
    currentLevel: DifficultyLevel;
    totalQuestions: number;
    score: number;
    correctCount: number;
    wrongCount: number;
    status: "ONGOING" | "FINISHED";
    startedAt: string;
    finishedAt: string | null;
  };
  answers: StudentResultAnswer[];
  wrsLogs: {
    id: string;
    currentLevel: DifficultyLevel;
    candidateCount: number;
    totalWeight: number;
    randomValue: number;
    selectedQuestionWeight: number;
    selectedQuestionDifficulty: DifficultyLevel;
    questionText: string;
    createdAt: string;
  }[];
};

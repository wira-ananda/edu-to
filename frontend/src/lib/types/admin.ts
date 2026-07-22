import type { OwnerSummary } from "./questions";

export type TryoutStatus = "DRAFT" | "OPEN" | "CLOSED";

export type TryoutBankSummary = {
  id: string;
  name: string;
  totalAvailableQuestions: number;
};

export type AdminTryoutItem = {
  id: string;
  subjectId: string;
  ownerId: string | null;
  owner?: OwnerSummary;

  title: string;
  totalQuestions: number;
  durationMinutes: number;

  maxAttempts: number | null;
  status: TryoutStatus;

  createdAt: string;
  updatedAt: string;

  bank: TryoutBankSummary;
  totalSessions: number;
};

export type AdminTryoutsResponse = {
  ok: boolean;
  tryouts: AdminTryoutItem[];
};

export type AdminTryoutResponse = {
  ok: boolean;
  tryout: AdminTryoutItem;
};

export type CreateTryoutPayload = {
  subjectId: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
  maxAttempts: number | null;
  status: TryoutStatus;
};

export type UpdateTryoutPayload = CreateTryoutPayload;

export type MutateTryoutResponse = {
  ok: boolean;
  message: string;
  tryout: AdminTryoutItem;
};

export type UpdateTryoutStatusPayload = {
  status: TryoutStatus;
};

export type TryoutResultSession = {
  id: string;
  attemptNumber: number;
  score: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  status: "ONGOING" | "FINISHED";
  startedAt: string;
  finishedAt: string | null;
  answeredCount: number;
  student: {
    id: string;
    name: string;
    email: string;
    school: string | null;
    className: string | null;
  };
  tryout: {
    id: string;
    title: string;
    bankName: string;
  };
};

export type TryoutResultsResponse = {
  ok: boolean;
  sessions: TryoutResultSession[];
};

export type TryoutStatisticsResponse = {
  ok: boolean;
  summary: {
    totalStudents: number;
    totalSessions: number;
    finishedSessions: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    completionRate: number;
  };
  attemptTrend: {
    attemptNumber: number;
    averageScore: number;
    totalSessions: number;
  }[];
  studentProgress: {
    studentId: string;
    name: string;
    email: string;
    scores: {
      attemptNumber: number;
      score: number;
      status: string;
      startedAt: string;
      finishedAt: string | null;
    }[];
  }[];
};

export const tryoutStatusOptions: {
  value: TryoutStatus;
  label: string;
}[] = [
  {
    value: "DRAFT",
    label: "Draft",
  },
  {
    value: "OPEN",
    label: "Dibuka",
  },
  {
    value: "CLOSED",
    label: "Ditutup",
  },
];

export function getTryoutStatusLabel(status: TryoutStatus) {
  if (status === "DRAFT") return "Draft";
  if (status === "OPEN") return "Dibuka";

  return "Ditutup";
}

export function getTryoutStatusBadgeClass(status: TryoutStatus) {
  if (status === "DRAFT") {
    return "bg-slate-100 text-slate-700";
  }

  if (status === "OPEN") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-red-50 text-red-700";
}

export function getMaxAttemptsLabel(maxAttempts: number | null) {
  if (maxAttempts === null) {
    return "Tanpa batas";
  }

  return `${maxAttempts} kali`;
}

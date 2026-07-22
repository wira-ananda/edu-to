import type { OwnerSummary } from "./questions";
import type { AppRole } from "./users";

export type TryoutStatus = "DRAFT" | "OPEN" | "CLOSED";

export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type TryoutBankSummary = {
  id: string;
  name: string;
  totalAvailableQuestions: number;
};

export type AdminTryoutItem = {
  id: string;
  subjectId: string;
  ownerId: string | null;
  owner?: OwnerSummary | null;

  title: string;
  totalQuestions: number;
  durationMinutes: number;

  maxAttempts: number | null;
  status: TryoutStatus;

  createdAt: string;
  updatedAt: string;

  bank: TryoutBankSummary;

  totalSessions: number;
  totalEnrollments: number;
  totalParticipants: number;
  pendingRequests: number;
  rejectedParticipants: number;
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

export type TryoutProgressCurveItem = {
  attemptNumber: number;
  totalFinishedSessions: number;
  averageScore: number;
  averageCorrect: number;
  averageWrong: number;
  completionRate: number;
};

export type TryoutStatisticsResponse = {
  ok: boolean;
  tryout?: {
    id: string;
    title: string;
    bankName: string;
    maxAttempts: number | null;
    totalQuestions: number;
    durationMinutes: number;
    status: TryoutStatus;
  };
  summary: {
    totalParticipants: number;
    pendingRequests: number;
    rejectedParticipants: number;

    totalStudents: number;
    totalStudentsWithSession?: number;
    totalSessions: number;
    finishedSessions: number;
    totalFinishedParticipants?: number;

    averageScore: number;
    averageLatestScore?: number;
    highestScore: number;
    lowestScore: number;
    completionRate: number;

    trend?: "IMPROVING" | "DECLINING" | "STABLE" | "NO_DATA";
  };
  progressCurve?: TryoutProgressCurveItem[];
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

export type TryoutParticipantAttempt = {
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
};

export type TryoutParticipantItem = {
  id: string;
  tryoutId: string;
  studentId: string;
  status: EnrollmentStatus;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  student: {
    id: string;
    name: string;
    email: string;
    role?: AppRole;
    school: string | null;
    className: string | null;
    createdAt?: string;
    updatedAt?: string;
  };
  attempts: TryoutParticipantAttempt[];
};

export type TryoutParticipantsResponse = {
  ok: boolean;
  tryout: {
    id: string;
    title: string;
    maxAttempts: number | null;
    status: TryoutStatus;
  };
  summary: {
    totalParticipants: number;
    pendingRequests: number;
    rejectedParticipants: number;
    totalEnrollments: number;
  };
  participants: TryoutParticipantItem[];
};

export type EnrollStudentResponse = {
  ok: boolean;
  message: string;
  enrollment: TryoutParticipantItem;
};

export type MutateEnrollmentResponse = {
  ok: boolean;
  message: string;
  enrollment: TryoutParticipantItem;
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

export const enrollmentStatusOptions: {
  value: EnrollmentStatus;
  label: string;
}[] = [
  {
    value: "PENDING",
    label: "Menunggu",
  },
  {
    value: "APPROVED",
    label: "Disetujui",
  },
  {
    value: "REJECTED",
    label: "Ditolak",
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

export function getEnrollmentStatusLabel(status: EnrollmentStatus | null) {
  if (status === "PENDING") return "Menunggu persetujuan";
  if (status === "APPROVED") return "Disetujui";
  if (status === "REJECTED") return "Ditolak";

  return "Belum terdaftar";
}

export function getEnrollmentStatusBadgeClass(status: EnrollmentStatus | null) {
  if (status === "PENDING") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "APPROVED") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "REJECTED") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

export function getMaxAttemptsLabel(maxAttempts: number | null) {
  if (maxAttempts === null) {
    return "Tanpa batas";
  }

  return `${maxAttempts} kali`;
}

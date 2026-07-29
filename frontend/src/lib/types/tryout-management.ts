import type { TryoutStatus } from "$lib/types/admin";

export type TryoutManagementItem = {
  id: string;
  title: string;

  totalQuestions: number;
  durationMinutes: number;
  maxAttempts: number | null;
  status: TryoutStatus;

  joinCode: string | null;
  joinCodeEnabled: boolean;

  totalEnrollments: number;
  totalParticipants: number;
  pendingRequests: number;
  rejectedParticipants: number;
  totalSessions: number;

  createdAt: string;

  bank: {
    id: string;
    name: string;
    totalAvailableQuestions: number;
  };

  owner?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  } | null;
};

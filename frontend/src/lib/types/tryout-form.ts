import type { TryoutStatus } from "$lib/types/admin";

export type TryoutFormMode = "create" | "edit";

export type TryoutFormSubject = {
  id: string;
  name: string;
  totalAvailableQuestions: number;
};

export type TryoutFormInitialValue = {
  id: string;
  subjectId: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
  maxAttempts: number | null;
  status: TryoutStatus;
};

export type TryoutFormPayload = {
  subjectId: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
  maxAttempts: number | null;
  status: TryoutStatus;
};

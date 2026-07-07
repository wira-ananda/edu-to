export type AdminTryoutItem = {
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
  totalSessions: number;
};

export type AdminTryoutsResponse = {
  ok: boolean;
  tryouts: AdminTryoutItem[];
};

export type AdminTryoutResponse = {
  ok: boolean;
  tryout: AdminTryoutItem & {
    subjectId: string;
  };
};

export type CreateTryoutPayload = {
  subjectId: string;
  title: string;
  totalQuestions: number;
  durationMinutes: number;
};

export type UpdateTryoutPayload = CreateTryoutPayload;

export type MutateTryoutResponse = {
  ok: boolean;
  message: string;
  tryout: unknown;
};

export type AppRole = "ADMIN" | "TEACHER" | "STUDENT";

export type DifficultyLevel = "LOW" | "MEDIUM" | "HIGH";

export type WeightPriority = "LOW" | "NORMAL" | "HIGH" | "VERY_HIGH";

export type SessionStatus = "ONGOING" | "FINISHED";

export type AnswerOption = "A" | "B" | "C" | "D";

export type TryoutStatus = "DRAFT" | "OPEN" | "CLOSED";

export type EnrollmentStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AppUser = {
  id: string;
  supabaseUserId: string;
  name: string;
  email: string;
  role: AppRole;
  school: string | null;
  className: string | null;
  createdAt: Date;
  updatedAt: Date;
};

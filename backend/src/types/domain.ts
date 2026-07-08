export type AppRole = "ADMIN" | "STUDENT";

export type DifficultyLevel = "LOW" | "MEDIUM" | "HIGH";

export type WeightPriority = "LOW" | "NORMAL" | "HIGH" | "VERY_HIGH";

export type AnswerOption = "A" | "B" | "C" | "D";

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

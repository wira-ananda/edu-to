import { z } from "zod";
import type {
  DifficultyLevel,
  WeightPriority,
  TryoutStatus,
} from "../types/domain.js";

export const difficultyLevels: DifficultyLevel[] = ["LOW", "MEDIUM", "HIGH"];

export const weightPriorities: WeightPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "VERY_HIGH",
];

export const tryoutStatuses: TryoutStatus[] = ["DRAFT", "OPEN", "CLOSED"];

const maxAttemptsSchema = z.preprocess((value) => {
  if (value === undefined) return 1;
  if (value === null) return null;
  if (value === "") return null;

  if (typeof value === "string" && value.toLowerCase() === "unlimited") {
    return null;
  }

  return Number(value);
}, z.number().int().min(1, "Jumlah attempt minimal 1").nullable());

export const teacherSubjectSchema = z.object({
  name: z.string().trim().min(2, "Nama bank soal wajib diisi"),
});

export const teacherTryoutSchema = z.object({
  subjectId: z.string().trim().min(1, "Bank soal wajib dipilih"),

  title: z.string().trim().min(3, "Judul tryout minimal 3 karakter"),

  totalQuestions: z.coerce.number().int().min(1, "Jumlah soal minimal 1"),

  durationMinutes: z.coerce.number().int().min(1, "Durasi minimal 1 menit"),

  maxAttempts: maxAttemptsSchema,

  status: z.enum(["DRAFT", "OPEN", "CLOSED"]).default("OPEN"),
});

export const teacherTryoutStatusSchema = z.object({
  status: z.enum(["DRAFT", "OPEN", "CLOSED"]),
});

export const teacherQuestionSchema = z.object({
  subjectId: z.string().trim().min(1, "Bank soal wajib dipilih"),

  questionText: z.string().trim().min(5, "Teks soal minimal 5 karakter"),

  imageAltText: z
    .string()
    .trim()
    .max(250, "Alt text maksimal 250 karakter")
    .optional()
    .nullable(),

  optionA: z.string().trim().min(1, "Option A wajib diisi"),

  optionB: z.string().trim().min(1, "Option B wajib diisi"),

  optionC: z.string().trim().min(1, "Option C wajib diisi"),

  optionD: z.string().trim().min(1, "Option D wajib diisi"),

  correctAnswer: z.enum(["A", "B", "C", "D"]),

  weightPriority: z
    .enum(["LOW", "NORMAL", "HIGH", "VERY_HIGH"])
    .default("NORMAL"),

  removeImage: z.boolean().optional().default(false),
});

export const teacherAnalyzeQuestionSchema = z.object({
  questionText: z.string().trim().min(5, "Teks soal minimal 5 karakter"),

  imageAltText: z.string().trim().optional().nullable(),

  hasImage: z.boolean().optional().default(false),

  weightPriority: z
    .enum(["LOW", "NORMAL", "HIGH", "VERY_HIGH"])
    .default("NORMAL"),
});

export type TeacherSubjectInput = z.infer<typeof teacherSubjectSchema>;

export type TeacherTryoutInput = z.infer<typeof teacherTryoutSchema>;

export type TeacherTryoutStatusInput = z.infer<
  typeof teacherTryoutStatusSchema
>;

export type TeacherQuestionInput = z.infer<typeof teacherQuestionSchema>;

export type TeacherAnalyzeQuestionInput = z.infer<
  typeof teacherAnalyzeQuestionSchema
>;

import { z } from "zod";
import type {
  DifficultyLevel,
  EnrollmentStatus,
  WeightPriority,
} from "../types/domain.js";

export const difficultyLevels: DifficultyLevel[] = ["LOW", "MEDIUM", "HIGH"];

export const weightPriorities: WeightPriority[] = [
  "LOW",
  "NORMAL",
  "HIGH",
  "VERY_HIGH",
];

export const tryoutStatuses = ["DRAFT", "OPEN", "CLOSED"] as const;

export const enrollmentStatuses: EnrollmentStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

const maxAttemptsSchema = z.preprocess((value) => {
  if (value === undefined) return 1;
  if (value === null) return null;
  if (value === "") return null;

  if (typeof value === "string" && value.toLowerCase() === "unlimited") {
    return null;
  }

  return Number(value);
}, z.number().int().min(1, "Jumlah attempt minimal 1").nullable());

export const adminSubjectSchema = z.object({
  name: z.string().trim().min(2, "Nama mata pelajaran wajib diisi"),
  ownerId: z.string().trim().optional().nullable(),
});

export const adminTryoutSchema = z.object({
  subjectId: z.string().trim().min(1, "Bank soal wajib dipilih"),

  title: z.string().trim().min(3, "Judul tryout minimal 3 karakter"),

  totalQuestions: z.coerce.number().int().min(1, "Jumlah soal minimal 1"),

  durationMinutes: z.coerce.number().int().min(1, "Durasi minimal 1 menit"),

  maxAttempts: maxAttemptsSchema,

  status: z.enum(tryoutStatuses).default("OPEN"),
});

export const adminTryoutStatusSchema = z.object({
  status: z.enum(tryoutStatuses),
});

export const adminQuestionSchema = z.object({
  subjectId: z.string().trim().min(1, "Mata pelajaran wajib dipilih"),

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

export const adminAnalyzeQuestionSchema = z.object({
  questionText: z.string().trim().min(5, "Teks soal minimal 5 karakter"),

  imageAltText: z
    .string()
    .trim()
    .max(250, "Alt text maksimal 250 karakter")
    .optional()
    .nullable(),

  hasImage: z.boolean().optional().default(false),

  weightPriority: z
    .enum(["LOW", "NORMAL", "HIGH", "VERY_HIGH"])
    .default("NORMAL"),
});

export const adminEnrollStudentSchema = z.object({
  tryoutId: z.string().trim().min(1, "Tryout wajib dikirim"),
  studentId: z.string().trim().min(1, "Siswa wajib dikirim"),
});

export const adminEnrollmentParamSchema = z.object({
  enrollmentId: z.string().trim().min(1, "Data peserta wajib dikirim"),
});

export const adminEnrollmentStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
});

export type AdminSubjectInput = z.infer<typeof adminSubjectSchema>;

export type AdminTryoutInput = z.infer<typeof adminTryoutSchema>;

export type AdminTryoutStatusInput = z.infer<typeof adminTryoutStatusSchema>;

export type AdminQuestionInput = z.infer<typeof adminQuestionSchema>;

export type AdminAnalyzeQuestionInput = z.infer<
  typeof adminAnalyzeQuestionSchema
>;

export type AdminEnrollStudentInput = z.infer<typeof adminEnrollStudentSchema>;

export type AdminEnrollmentParamInput = z.infer<
  typeof adminEnrollmentParamSchema
>;

export type AdminEnrollmentStatusInput = z.infer<
  typeof adminEnrollmentStatusSchema
>;

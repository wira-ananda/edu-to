import { z } from "zod";

export const startTryoutSchema = z.object({
  tryoutId: z.string().min(1, "Tryout wajib dipilih"),
});

export const answerQuestionSchema = z.object({
  questionId: z.string().min(1, "Soal wajib dikirim"),
  selectedAnswer: z.enum(["A", "B", "C", "D"]),
});

export type StartTryoutInput = z.infer<typeof startTryoutSchema>;

export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>;

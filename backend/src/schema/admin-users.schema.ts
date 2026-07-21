import { z } from "zod";

export const createTeacherSchema = z.object({
  name: z.string().trim().min(2, "Nama guru minimal 2 karakter"),

  email: z.string().trim().email("Format email tidak valid"),

  password: z.string().min(8, "Password minimal 8 karakter"),

  school: z.string().trim().optional().nullable(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

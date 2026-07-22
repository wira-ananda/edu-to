export type AppRole = "ADMIN" | "TEACHER" | "STUDENT";

export type AppUser = {
  id: string;
  supabaseUserId: string;
  name: string;
  email: string;
  role: AppRole;
  school: string | null;
  className: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeacherAccount = {
  id: string;
  supabaseUserId: string;
  name: string;
  email: string;
  role: "TEACHER";
  school: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TeacherAccountsResponse = {
  ok: boolean;
  teachers: TeacherAccount[];
};

export type CreateTeacherPayload = {
  name: string;
  email: string;
  password: string;
  school?: string | null;
};

export type MutateTeacherResponse = {
  ok: boolean;
  message: string;
  teacher?: TeacherAccount;
};

export type MeResponse = {
  ok: boolean;
  user: AppUser;
};

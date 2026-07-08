export type TeacherAccount = {
  id: string;
  supabaseUserId: string;
  name: string;
  email: string;
  role: "ADMIN";
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

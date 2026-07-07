import { supabase } from "./supabase";
import { apiFetch } from "./api";

export type AppRole = "ADMIN" | "STUDENT";

export type AppUser = {
  id: string;
  supabaseUserId: string;
  name: string;
  email: string;
  role: AppRole;
  school?: string | null;
  className?: string | null;
};

type MeResponse = {
  ok: boolean;
  user: AppUser;
};

export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    return null;
  }

  const result = await apiFetch<MeResponse>("/me");

  return result.user;
}

export async function logout() {
  await supabase.auth.signOut();
}

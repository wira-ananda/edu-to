import { apiFetch } from "$lib/api";
import { supabase } from "$lib/supabase";
import type { AppRole, AppUser, MeResponse } from "$lib/types/users";

export type { AppRole, AppUser } from "$lib/types/users";

export async function getCurrentUser() {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    return null;
  }

  try {
    const result = await apiFetch<MeResponse>("/me");

    return result.user;
  } catch {
    return null;
  }
}

export async function logout() {
  await supabase.auth.signOut();
}

export function getHomePathByRole(role: AppRole) {
  if (role === "ADMIN") {
    return "/admin";
  }

  if (role === "TEACHER") {
    return "/teacher";
  }

  return "/student";
}

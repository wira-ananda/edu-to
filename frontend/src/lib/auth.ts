import { apiFetch, ApiError } from "$lib/api";
import { supabase } from "$lib/supabase";

import type { AppRole, AppUser, MeResponse } from "$lib/types/users";

export type { AppRole, AppUser } from "$lib/types/users";

export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const result = await apiFetch<MeResponse>("/me");

    return result.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
}

export async function logout() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
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

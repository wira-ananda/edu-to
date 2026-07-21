import type { AppUser } from "../types/domain.js";

export type AccessUser = Pick<AppUser, "id" | "role">;

export function isAdmin(user: AccessUser) {
  return user.role === "ADMIN";
}

export function isTeacher(user: AccessUser) {
  return user.role === "TEACHER";
}

export function getOwnerFilter(user: AccessUser) {
  if (isAdmin(user)) {
    return {};
  }

  return {
    ownerId: user.id,
  };
}

export function getOwnerIdForCreate(user: AccessUser, ownerId?: string | null) {
  if (isAdmin(user)) {
    return ownerId ?? null;
  }

  return user.id;
}

export function getTryoutQuestionWhere(tryout: {
  subjectId: string;
  ownerId: string | null;
}) {
  return {
    subjectId: tryout.subjectId,
    ...(tryout.ownerId ? { ownerId: tryout.ownerId } : {}),
  };
}

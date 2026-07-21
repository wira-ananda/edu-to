import type { Context } from "hono";
import adminUsersService, {
  AdminUsersServiceError,
} from "../service/admin-users.service.js";
import { createTeacherSchema } from "../schema/admin-users.schema.js";
import type { AppEnv } from "../types/hono.js";

type AdminUsersContext = Context<AppEnv>;

function getErrorStatus(error: unknown) {
  if (error instanceof AdminUsersServiceError) {
    return error.statusCode;
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback = "Terjadi kesalahan") {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function getValidationMessage(parsedError: {
  issues: {
    message: string;
  }[];
}) {
  return parsedError.issues[0]?.message ?? "Data guru tidak valid";
}

function getRequiredParam(c: AdminUsersContext, key: string) {
  const value = c.req.param(key);

  if (!value) {
    throw new AdminUsersServiceError(`${key} wajib dikirim`, 400);
  }

  return value;
}

function handleError(c: AdminUsersContext, error: unknown, fallback?: string) {
  return c.json(
    {
      ok: false,
      message: getErrorMessage(error, fallback),
    },
    getErrorStatus(error) as 400 | 401 | 403 | 404 | 409 | 500,
  );
}

async function getTeachers(c: AdminUsersContext) {
  try {
    const result = await adminUsersService.getTeachers();

    return c.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    return handleError(c, error, "Gagal memuat akun guru");
  }
}

async function createTeacher(c: AdminUsersContext) {
  try {
    const body = await c.req.json().catch(() => null);

    const parsed = createTeacherSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          ok: false,
          message: getValidationMessage(parsed.error),
        },
        400,
      );
    }

    const result = await adminUsersService.createTeacher(parsed.data);

    return c.json(
      {
        ok: true,
        message: "Akun guru berhasil dibuat",
        ...result,
      },
      201,
    );
  } catch (error) {
    return handleError(c, error, "Gagal membuat akun guru");
  }
}

async function deleteTeacher(c: AdminUsersContext) {
  try {
    const currentUser = c.get("user");
    const teacherId = getRequiredParam(c, "id");

    await adminUsersService.deleteTeacher(currentUser.id, teacherId);

    return c.json({
      ok: true,
      message: "Akun guru berhasil dihapus",
    });
  } catch (error) {
    return handleError(c, error, "Gagal menghapus akun guru");
  }
}

export default {
  getTeachers,
  createTeacher,
  deleteTeacher,
};

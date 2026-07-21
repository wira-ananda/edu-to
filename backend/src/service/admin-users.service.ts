import { prisma } from "../lib/prisma.js";
import { supabaseAdmin } from "../lib/supabase-admin.js";
import type { CreateTeacherInput } from "../schema/admin-users.schema.js";

export class AdminUsersServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function cleanOptionalText(value?: string | null) {
  const cleaned = value?.trim();

  return cleaned ? cleaned : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan pada server";
}

async function getTeachers() {
  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
    },
    select: {
      id: true,
      supabaseUserId: true,
      name: true,
      email: true,
      role: true,
      school: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return {
    teachers,
  };
}

async function createTeacher(input: CreateTeacherInput) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const school = cleanOptionalText(input.school);

  const existingLocalUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingLocalUser) {
    throw new AdminUsersServiceError("Email sudah terdaftar di sistem", 409);
  }

  let supabaseUserId: string | null = null;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name,
        role: "TEACHER",
        school,
      },
    });

    if (error) {
      throw new AdminUsersServiceError(error.message, 400);
    }

    if (!data.user?.id) {
      throw new AdminUsersServiceError("Gagal membuat akun Supabase", 500);
    }

    supabaseUserId = data.user.id;

    const teacher = await prisma.user.create({
      data: {
        supabaseUserId,
        name,
        email,
        role: "TEACHER",
        school,
        className: null,
      },
      select: {
        id: true,
        supabaseUserId: true,
        name: true,
        email: true,
        role: true,
        school: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      teacher,
    };
  } catch (error) {
    if (supabaseUserId) {
      await supabaseAdmin.auth.admin
        .deleteUser(supabaseUserId)
        .catch(() => null);
    }

    if (error instanceof AdminUsersServiceError) {
      throw error;
    }

    throw new AdminUsersServiceError(getErrorMessage(error), 500);
  }
}

async function deleteTeacher(currentUserId: string, teacherId: string) {
  if (teacherId === currentUserId) {
    throw new AdminUsersServiceError(
      "Akun yang sedang login tidak boleh dihapus",
      400,
    );
  }

  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "TEACHER",
    },
  });

  if (!teacher) {
    throw new AdminUsersServiceError("Akun guru tidak ditemukan", 404);
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(
    teacher.supabaseUserId,
  );

  if (error) {
    throw new AdminUsersServiceError(error.message, 400);
  }

  await prisma.user.delete({
    where: {
      id: teacher.id,
    },
  });

  return null;
}

export default {
  getTeachers,
  createTeacher,
  deleteTeacher,
};

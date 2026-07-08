import { Hono } from "hono";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { supabaseAdmin } from "../lib/supabase-admin";
import { authMiddleware } from "../middlewares/auth";
import { roleMiddleware } from "../middlewares/role";
import type { AppEnv } from "../types/hono";

export const adminUserRoutes = new Hono<AppEnv>();

adminUserRoutes.use("*", authMiddleware, roleMiddleware(["ADMIN"]));

const createTeacherSchema = z.object({
  name: z.string().min(2, "Nama guru minimal 2 karakter"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
  school: z.string().optional().nullable(),
});

function cleanOptionalText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan pada server";
}

adminUserRoutes.get("/teachers", async (c) => {
  const teachers = await prisma.user.findMany({
    where: {
      role: "ADMIN",
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

  return c.json({
    ok: true,
    teachers,
  });
});

adminUserRoutes.post("/teachers", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = createTeacherSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Data guru tidak valid",
      },
      400,
    );
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const school = cleanOptionalText(parsed.data.school);

  const existingLocalUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingLocalUser) {
    return c.json(
      {
        ok: false,
        message: "Email sudah terdaftar di sistem",
      },
      409,
    );
  }

  let supabaseUserId: string | null = null;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        name,
        role: "ADMIN",
      },
    });

    if (error) {
      return c.json(
        {
          ok: false,
          message: error.message,
        },
        400,
      );
    }

    if (!data.user?.id) {
      return c.json(
        {
          ok: false,
          message: "Gagal membuat akun Supabase",
        },
        500,
      );
    }

    supabaseUserId = data.user.id;

    const teacher = await prisma.user.create({
      data: {
        supabaseUserId,
        name,
        email,
        role: "ADMIN",
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

    return c.json(
      {
        ok: true,
        message: "Akun guru berhasil dibuat",
        teacher,
      },
      201,
    );
  } catch (error) {
    if (supabaseUserId) {
      await supabaseAdmin.auth.admin
        .deleteUser(supabaseUserId)
        .catch(() => null);
    }

    return c.json(
      {
        ok: false,
        message: getErrorMessage(error),
      },
      500,
    );
  }
});

adminUserRoutes.delete("/teachers/:id", async (c) => {
  const currentUser = c.get("user");
  const teacherId = c.req.param("id");

  if (teacherId === currentUser.id) {
    return c.json(
      {
        ok: false,
        message: "Akun yang sedang login tidak boleh dihapus",
      },
      400,
    );
  }

  const teacher = await prisma.user.findFirst({
    where: {
      id: teacherId,
      role: "ADMIN",
    },
  });

  if (!teacher) {
    return c.json(
      {
        ok: false,
        message: "Akun guru tidak ditemukan",
      },
      404,
    );
  }

  const { error } = await supabaseAdmin.auth.admin.deleteUser(
    teacher.supabaseUserId,
  );

  if (error) {
    return c.json(
      {
        ok: false,
        message: error.message,
      },
      400,
    );
  }

  await prisma.user.delete({
    where: {
      id: teacher.id,
    },
  });

  return c.json({
    ok: true,
    message: "Akun guru berhasil dihapus",
  });
});

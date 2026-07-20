import "./lib/env.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { prisma } from "./lib/prisma.js";
import { supabaseAdmin } from "./lib/supabase-admin.js";
import { authMiddleware } from "./middlewares/auth.js";
import { adminRoutes } from "./routes/admin.js";
import { adminUserRoutes } from "./routes/admin-users.js";
import { studentRoutes } from "./routes/student.js";
import type { AppEnv } from "./types/hono.js";

const app = new Hono<AppEnv>();

app.use(
  "*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

const registerSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  school: z.string().optional().nullable(),
  className: z.string().optional().nullable(),
});

function cleanOptionalText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null; 
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan pada server";
}

app.get("/", (c) => {
  return c.json({
    ok: true,
    message: "EduTryout API running",
  });
});

app.get("/health/db", async (c) => {
  const totalUsers = await prisma.user.count();
  const totalSubjects = await prisma.subject.count();
  const totalQuestions = await prisma.question.count();
  const totalTryouts = await prisma.tryout.count();
  const totalSessions = await prisma.tryoutSession.count();

  return c.json({
    ok: true,
    database: "connected",
    totalUsers,
    totalSubjects,
    totalQuestions,
    totalTryouts,
    totalSessions,
  });
});

app.post("/auth/register", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        ok: false,
        message: parsed.error.issues[0]?.message ?? "Data register tidak valid",
      },
      400,
    );
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  const password = parsed.data.password;
  const school = cleanOptionalText(parsed.data.school);
  const className = cleanOptionalText(parsed.data.className);

  const existingAppUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingAppUser) {
    return c.json(
      {
        ok: false,
        message: "Email sudah terdaftar. Silakan login.",
      },
      409,
    );
  }

  const { data: existingUsers, error: listError } =
    await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

  if (listError) {
    return c.json(
      {
        ok: false,
        message: listError.message,
      },
      500,
    );
  }

  const existingSupabaseUser = existingUsers.users.find((user) => {
    return user.email?.toLowerCase() === email;
  });

  if (existingSupabaseUser) {
    return c.json(
      {
        ok: false,
        message:
          "Email sudah ada di Supabase Auth tetapi belum tersinkron ke NeonDB. Hapus user tersebut di Supabase Auth atau gunakan email lain.",
      },
      409,
    );
  }

  let supabaseUserId: string | null = null;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        school,
        className,
        role: "STUDENT",
      },
    });

    if (error || !data.user) {
      return c.json(
        {
          ok: false,
          message: error?.message ?? "Gagal membuat user Supabase",
        },
        500,
      );
    }

    supabaseUserId = data.user.id;

    const appUser = await prisma.user.create({
      data: {
        supabaseUserId,
        name,
        email,
        role: "STUDENT",
        school,
        className,
      },
    });

    return c.json(
      {
        ok: true,
        message: "Registrasi berhasil",
        user: appUser,
      },
      201,
    );
  } catch (error) {
    if (supabaseUserId) {
      await supabaseAdmin.auth.admin.deleteUser(supabaseUserId).catch(() => {
        return null;
      });
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

app.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");

  return c.json({
    ok: true,
    user,
  });
});

app.route("/admin/users", adminUserRoutes);
app.route("/admin", adminRoutes);
app.route("/student", studentRoutes);

app.notFound((c) => {
  return c.json(
    {
      ok: false,
      message: "Route not found",
    },
    404,
  );
});

app.onError((error, c) => {
  console.error(error);

  return c.json(
    {
      ok: false,
      message: "Internal server error",
    },
    500,
  );
});

export default app;

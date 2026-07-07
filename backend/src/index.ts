import "./lib/env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { z } from "zod";
import { prisma } from "./lib/prisma";
import { supabaseAdmin } from "./lib/supabase-admin";
import { authMiddleware } from "./middlewares/auth";
import { adminRoutes } from "./routes/admin";
import { studentRoutes } from "./routes/student";
import type { AppEnv } from "./types/hono";

const app = new Hono<AppEnv>();

const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

const registerSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
  school: z.string().optional(),
  className: z.string().optional(),
});

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

  const { name, password, school, className } = parsed.data;
  const email = parsed.data.email.toLowerCase().trim();

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

  const existingSupabaseUser = existingUsers.users.find(
    (user) => user.email?.toLowerCase() === email,
  );

  if (existingSupabaseUser) {
    return c.json(
      {
        ok: false,
        message:
          "Email sudah ada di Supabase Auth tetapi belum tersinkron ke NeonDB. Hapus user tersebut di Supabase Auth atau gunakan email lain untuk register ulang.",
      },
      409,
    );
  }

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

  const appUser = await prisma.user.create({
    data: {
      supabaseUserId: data.user.id,
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
});

app.get("/me", authMiddleware, async (c) => {
  const user = c.get("user");

  return c.json({
    ok: true,
    user,
  });
});

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

export default {
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
};

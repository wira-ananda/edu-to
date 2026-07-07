import type { MiddlewareHandler } from "hono";
import { supabase } from "../lib/supabase";
import { prisma } from "../lib/prisma";
import type { AppEnv } from "../types/hono";

function getStringMetadata(value: unknown) {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json(
      {
        ok: false,
        message: "Unauthorized",
      },
      401,
    );
  }

  const token = authHeader.replace("Bearer ", "").trim();

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return c.json(
      {
        ok: false,
        message: "Invalid token",
      },
      401,
    );
  }

  const email = data.user.email;

  if (!email) {
    return c.json(
      {
        ok: false,
        message: "Email not found in Supabase user",
      },
      400,
    );
  }

  const metadata = data.user.user_metadata ?? {};

  const name = getStringMetadata(metadata.name) ?? email;
  const school = getStringMetadata(metadata.school);
  const className = getStringMetadata(metadata.className);

  const appUser = await prisma.user.upsert({
    where: {
      supabaseUserId: data.user.id,
    },
    update: {
      email,
      name,
      school,
      className,
    },
    create: {
      supabaseUserId: data.user.id,
      name,
      email,
      role: "STUDENT",
      school,
      className,
    },
  });

  c.set("user", appUser);

  await next();
};

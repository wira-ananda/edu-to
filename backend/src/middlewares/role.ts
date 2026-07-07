import type { MiddlewareHandler } from "hono";
import type { Role } from "../generated/prisma/client";
import type { AppEnv } from "../types/hono";

export function roleMiddleware(
  allowedRoles: Role[],
): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const user = c.get("user");

    if (!user) {
      return c.json(
        {
          ok: false,
          message: "Unauthorized",
        },
        401,
      );
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json(
        {
          ok: false,
          message: "Forbidden",
        },
        403,
      );
    }

    await next();
  };
}

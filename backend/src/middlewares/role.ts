import type { MiddlewareHandler } from "hono";
import type { AppRole } from "../types/domain.js";
import type { AppEnv } from "../types/hono.js";
import type { Role } from "@prisma/client/index-browser";

export function roleMiddleware(
  allowedRoles: AppRole[],
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

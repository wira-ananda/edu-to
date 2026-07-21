import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.js";
import { roleMiddleware } from "../middlewares/role.js";
import adminUsersController from "../controller/admin-users.controller.js";
import type { AppEnv } from "../types/hono.js";

export const adminUserRoutes = new Hono<AppEnv>();

adminUserRoutes.use("*", authMiddleware, roleMiddleware(["ADMIN"]));

adminUserRoutes.get("/teachers", adminUsersController.getTeachers);

adminUserRoutes.post("/teachers", adminUsersController.createTeacher);

adminUserRoutes.delete("/teachers/:id", adminUsersController.deleteTeacher);

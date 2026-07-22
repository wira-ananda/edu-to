import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.js";
import { roleMiddleware } from "../middlewares/role.js";
import studentController from "../controller/student.controller.js";
import type { AppEnv } from "../types/hono.js";

export const studentRoutes = new Hono<AppEnv>();

studentRoutes.use("*", authMiddleware, roleMiddleware(["STUDENT"]));

studentRoutes.get("/check", studentController.check);

studentRoutes.get("/tryouts", studentController.getTryouts);
studentRoutes.post(
  "/tryouts/:tryoutId/request-join",
  studentController.requestJoinTryout,
);
studentRoutes.post("/tryouts/start", studentController.startTryout);

studentRoutes.get("/sessions", studentController.getSessions);
studentRoutes.get(
  "/sessions/:sessionId/next-question",
  studentController.getNextQuestion,
);
studentRoutes.post(
  "/sessions/:sessionId/answer",
  studentController.answerQuestion,
);
studentRoutes.post(
  "/sessions/:sessionId/timeout",
  studentController.timeoutSession,
);
studentRoutes.get(
  "/sessions/:sessionId/result",
  studentController.getSessionResult,
);

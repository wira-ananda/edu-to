import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.js";
import { roleMiddleware } from "../middlewares/role.js";
import teacherController from "../controller/teacher.controller.js";
import type { AppEnv } from "../types/hono.js";

export const teacherRoutes = new Hono<AppEnv>();

teacherRoutes.use("*", authMiddleware, roleMiddleware(["TEACHER"]));

teacherRoutes.get("/check", teacherController.check);

teacherRoutes.get("/subjects", teacherController.getSubjects);
teacherRoutes.post("/subjects", teacherController.createSubject);

teacherRoutes.post("/questions/analyze", teacherController.analyzeQuestion);

teacherRoutes.get("/questions", teacherController.getQuestions);
teacherRoutes.get("/question-banks", teacherController.getQuestionBanks);
teacherRoutes.get("/questions/:id", teacherController.getQuestionById);
teacherRoutes.post("/questions", teacherController.createQuestion);
teacherRoutes.put("/questions/:id", teacherController.updateQuestion);
teacherRoutes.delete("/questions/:id", teacherController.deleteQuestion);

teacherRoutes.get("/tryouts", teacherController.getTryouts);
teacherRoutes.get("/tryouts/:id", teacherController.getTryoutById);
teacherRoutes.post("/tryouts", teacherController.createTryout);
teacherRoutes.put("/tryouts/:id", teacherController.updateTryout);
teacherRoutes.patch(
  "/tryouts/:id/status",
  teacherController.updateTryoutStatus,
);
teacherRoutes.delete("/tryouts/:id", teacherController.deleteTryout);

teacherRoutes.get("/tryouts/:id/results", teacherController.getTryoutResults);
teacherRoutes.get(
  "/tryouts/:id/statistics",
  teacherController.getTryoutStatistics,
);

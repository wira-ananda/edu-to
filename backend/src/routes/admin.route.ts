import { Hono } from "hono";
import { authMiddleware } from "../middlewares/auth.js";
import { roleMiddleware } from "../middlewares/role.js";
import adminController from "../controller/admin.controller.js";
import type { AppEnv } from "../types/hono.js";

export const adminRoutes = new Hono<AppEnv>();

adminRoutes.use("*", authMiddleware, roleMiddleware(["ADMIN"]));

adminRoutes.get("/check", adminController.check);

adminRoutes.get("/subjects", adminController.getSubjects);
adminRoutes.post("/subjects", adminController.createSubject);

adminRoutes.post("/questions/analyze", adminController.analyzeQuestion);

adminRoutes.get("/questions", adminController.getQuestions);
adminRoutes.get("/question-banks", adminController.getQuestionBanks);
adminRoutes.get("/questions/:id", adminController.getQuestionById);
adminRoutes.post("/questions", adminController.createQuestion);
adminRoutes.put("/questions/:id", adminController.updateQuestion);
adminRoutes.delete("/questions/:id", adminController.deleteQuestion);

adminRoutes.get("/tryouts", adminController.getTryouts);
adminRoutes.get("/tryouts/:id", adminController.getTryoutById);
adminRoutes.post("/tryouts", adminController.createTryout);
adminRoutes.put("/tryouts/:id", adminController.updateTryout);
adminRoutes.patch("/tryouts/:id/status", adminController.updateTryoutStatus);
adminRoutes.delete("/tryouts/:id", adminController.deleteTryout);

adminRoutes.get("/tryouts/:id/results", adminController.getTryoutResults);
adminRoutes.get("/tryouts/:id/statistics", adminController.getTryoutStatistics);

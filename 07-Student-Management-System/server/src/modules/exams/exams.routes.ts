import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import {
  createExamHandler,
  enterMarksHandler,
  getMarksHandler,
  listExamsHandler,
  publishHandler,
} from "./exams.controller.js";

export const examsRouter = Router();
examsRouter.use(authenticate);
examsRouter.get("/", asyncHandler(listExamsHandler));
examsRouter.post("/", requireRole("ADMIN", "TEACHER"), asyncHandler(createExamHandler));
examsRouter.get("/:id/marks", asyncHandler(getMarksHandler));
examsRouter.post("/:id/marks", requireRole("ADMIN", "TEACHER"), asyncHandler(enterMarksHandler));
examsRouter.post("/:id/publish", requireRole("ADMIN", "TEACHER"), asyncHandler(publishHandler));

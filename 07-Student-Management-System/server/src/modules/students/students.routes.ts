import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import {
  createStudentHandler,
  deactivateStudentHandler,
  exportStudentReportHandler,
  getStudentHandler,
  getStudentMarksHandler,
  listStudentsHandler,
  updateStudentHandler,
} from "./students.controller.js";

export const studentsRouter = Router();
studentsRouter.use(authenticate);
studentsRouter.get("/", requireRole("ADMIN", "TEACHER"), asyncHandler(listStudentsHandler));
studentsRouter.post("/", requireRole("ADMIN"), asyncHandler(createStudentHandler));
studentsRouter.get("/:id", asyncHandler(getStudentHandler));
studentsRouter.get("/:id/marks", asyncHandler(getStudentMarksHandler));
studentsRouter.get("/:id/report", asyncHandler(exportStudentReportHandler));
studentsRouter.patch("/:id", requireRole("ADMIN", "TEACHER"), asyncHandler(updateStudentHandler));
studentsRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(deactivateStudentHandler));

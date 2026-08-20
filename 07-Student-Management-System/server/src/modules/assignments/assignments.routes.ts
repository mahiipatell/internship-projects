import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import {
  createAssignmentHandler,
  gradeHandler,
  listAssignmentsHandler,
  listSubmissionsHandler,
  submitHandler,
} from "./assignments.controller.js";

export const assignmentsRouter = Router();
assignmentsRouter.use(authenticate);
assignmentsRouter.get("/", asyncHandler(listAssignmentsHandler));
// Teacher-only: Assignment.teacherId is required, and an admin has no teacher profile.
assignmentsRouter.post("/", requireRole("TEACHER"), asyncHandler(createAssignmentHandler));
assignmentsRouter.get("/:id/submissions", asyncHandler(listSubmissionsHandler));
assignmentsRouter.post("/:id/submissions", requireRole("STUDENT"), asyncHandler(submitHandler));
assignmentsRouter.patch("/:id/submissions/:sid", requireRole("ADMIN", "TEACHER"), asyncHandler(gradeHandler));

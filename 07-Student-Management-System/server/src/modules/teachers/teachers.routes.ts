import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import {
  assignHandler,
  createTeacherHandler,
  deleteTeacherHandler,
  getTeacherHandler,
  listTeachersHandler,
  removeAssignmentHandler,
  updateTeacherHandler,
} from "./teachers.controller.js";

export const teachersRouter = Router();
teachersRouter.use(authenticate);
teachersRouter.get("/", requireRole("ADMIN"), asyncHandler(listTeachersHandler));
teachersRouter.post("/", requireRole("ADMIN"), asyncHandler(createTeacherHandler));
teachersRouter.get("/:id", asyncHandler(getTeacherHandler));
teachersRouter.patch("/:id", requireRole("ADMIN"), asyncHandler(updateTeacherHandler));
teachersRouter.post("/:id/assignments", requireRole("ADMIN"), asyncHandler(assignHandler));
teachersRouter.delete("/:id/assignments/:assignmentId", requireRole("ADMIN"), asyncHandler(removeAssignmentHandler));
teachersRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(deleteTeacherHandler));

import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import {
  listAttendanceHandler,
  markAttendanceHandler,
  updateAttendanceHandler,
} from "./attendance.controller.js";

export const attendanceRouter = Router();
attendanceRouter.use(authenticate);
attendanceRouter.get("/", asyncHandler(listAttendanceHandler));
attendanceRouter.post("/", requireRole("ADMIN", "TEACHER"), asyncHandler(markAttendanceHandler));
attendanceRouter.patch("/:id", requireRole("ADMIN", "TEACHER"), asyncHandler(updateAttendanceHandler));

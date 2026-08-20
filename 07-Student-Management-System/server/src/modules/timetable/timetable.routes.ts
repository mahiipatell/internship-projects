import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import {
  createSlotHandler,
  deleteSlotHandler,
  listTimetableHandler,
} from "./timetable.controller.js";

export const timetableRouter = Router();
timetableRouter.use(authenticate);
timetableRouter.get("/", asyncHandler(listTimetableHandler));
timetableRouter.post("/", requireRole("ADMIN"), asyncHandler(createSlotHandler));
timetableRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(deleteSlotHandler));

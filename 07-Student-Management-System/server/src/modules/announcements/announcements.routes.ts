import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { createAnnouncementHandler, listAnnouncementsHandler } from "./announcements.controller.js";

export const announcementsRouter = Router();
announcementsRouter.use(authenticate);
announcementsRouter.get("/", asyncHandler(listAnnouncementsHandler));
announcementsRouter.post("/", requireRole("ADMIN", "TEACHER"), asyncHandler(createAnnouncementHandler));

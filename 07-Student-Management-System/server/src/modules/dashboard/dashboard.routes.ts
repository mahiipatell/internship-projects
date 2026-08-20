import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { dashboardHandler } from "./dashboard.controller.js";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);
dashboardRouter.get("/", asyncHandler(dashboardHandler));

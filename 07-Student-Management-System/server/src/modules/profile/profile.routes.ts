import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { changePasswordHandler, getProfileHandler, updateProfileHandler } from "./profile.controller.js";

export const profileRouter = Router();
profileRouter.use(authenticate);
profileRouter.get("/", asyncHandler(getProfileHandler));
profileRouter.patch("/", asyncHandler(updateProfileHandler));
profileRouter.patch("/password", asyncHandler(changePasswordHandler));

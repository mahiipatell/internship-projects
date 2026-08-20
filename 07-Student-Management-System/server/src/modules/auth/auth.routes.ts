import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import {
  forgotHandler,
  loginHandler,
  logoutHandler,
  refreshHandler,
  resetHandler,
} from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/login", asyncHandler(loginHandler));
authRouter.post("/refresh", asyncHandler(refreshHandler));
authRouter.post("/logout", asyncHandler(logoutHandler));
authRouter.post("/forgot-password", asyncHandler(forgotHandler));
authRouter.post("/reset-password", asyncHandler(resetHandler));

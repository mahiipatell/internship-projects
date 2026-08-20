import type { Request, Response } from "express";
import { config, isProd } from "../../config.js";
import { badRequest } from "../../lib/errors.js";
import {
  forgotPassword,
  login,
  logout,
  refresh,
  resetPassword,
} from "./auth.service.js";
import { forgotSchema, loginSchema, resetSchema } from "./auth.schema.js";

const REFRESH_COOKIE = "refresh_token";

function setRefreshCookie(res: Response, raw: string) {
  res.cookie(REFRESH_COOKIE, raw, {
    httpOnly: true,
    // Cross-origin deployments (VITE_API_URL set) need the cookie sent on
    // cross-site requests; sameSite:"none" requires the Secure flag.
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/api",
    maxAge: config.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { path: "/api" });
}

export async function loginHandler(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const { accessToken, refreshTokenRaw, user } = await login(email, password);
  setRefreshCookie(res, refreshTokenRaw);
  res.json({ accessToken, user });
}

export async function refreshHandler(req: Request, res: Response) {
  const result = await refresh(req.cookies?.[REFRESH_COOKIE]);
  setRefreshCookie(res, result.refreshTokenRaw);
  res.json({ accessToken: result.accessToken, user: result.user });
}

export async function logoutHandler(req: Request, res: Response) {
  await logout(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.json({ message: "Logged out" });
}

export async function forgotHandler(req: Request, res: Response) {
  const { email } = forgotSchema.parse(req.body);
  const token = await forgotPassword(email);
  res.json({
    message: "If the account exists, a reset link has been sent.",
    // Dev convenience: returns the token instead of emailing it.
    ...(token && config.nodeEnv !== "production" ? { resetToken: token } : {}),
  });
}

export async function resetHandler(req: Request, res: Response) {
  const { token, password } = resetSchema.parse(req.body);
  await resetPassword(token, password);
  res.json({ message: "Password reset successful" });
}

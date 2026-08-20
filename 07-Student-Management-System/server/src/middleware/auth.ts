import type { RequestHandler } from "express";
import { unauthorized } from "../lib/errors.js";
import { verifyAccessToken } from "../lib/tokens.js";

// Reads the access token from the Authorization: Bearer header (client keeps it
// in memory) and attaches req.user. Refresh tokens live in an httpOnly cookie
// and are only consumed by /api/auth/refresh.
export const authenticate: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(unauthorized("Missing access token"));
  const token = header.slice("Bearer ".length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role as never, email: payload.email };
    next();
  } catch {
    next(unauthorized("Invalid or expired access token"));
  }
};

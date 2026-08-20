import type { RequestHandler } from "express";
import type { Role } from "@prisma/client";
import { forbidden } from "../lib/errors.js";

// Usage: router.use(requireRole("ADMIN")) or requireRole("ADMIN","TEACHER").
export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) return next(forbidden());
    if (!roles.includes(req.user.role)) return next(forbidden("Insufficient role"));
    next();
  };
}

// Centralized error types. Every route handler throws AppError; the error
// middleware maps it to { error: { code, message } }.

import type { NextFunction, Request, RequestHandler, Response } from "express";

export class AppError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "Unauthorized") =>
  new AppError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "Forbidden") =>
  new AppError(403, "FORBIDDEN", message);
export const notFound = (message = "Not found") =>
  new AppError(404, "NOT_FOUND", message);
export const conflict = (message: string) =>
  new AppError(409, "CONFLICT", message);

// Express 4 does not catch async route rejections; wrap handlers so a throw
// reaches the error middleware instead of crashing the process.
type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export const asyncHandler = (fn: AsyncFn): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

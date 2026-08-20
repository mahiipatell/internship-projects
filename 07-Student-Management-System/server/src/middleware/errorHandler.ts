import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "../lib/errors.js";

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ error: { code: "NOT_FOUND", message: "Route not found" } });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Validation failed", details: err.flatten() },
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const fields = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return res.status(409).json({
        error: { code: "CONFLICT", message: `Unique constraint failed on: ${fields}` },
      });
    }
    if (err.code === "P2003") {
      return res.status(400).json({
        error: { code: "BAD_REQUEST", message: "Referenced record does not exist" },
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: { code: "NOT_FOUND", message: "Record not found" } });
    }
  }

  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }

  console.error("[unhandled error]", err);
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } });
};

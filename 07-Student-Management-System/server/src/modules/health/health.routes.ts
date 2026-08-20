import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { prisma } from "../../lib/prisma.js";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
  let db = "disconnected";
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = "connected";
  } catch {
    db = "disconnected";
  }
  res.json({ status: "ok", db, time: new Date().toISOString() });
  })
);

import type { Request, Response } from "express";
import { getDashboard } from "./dashboard.service.js";

export async function dashboardHandler(req: Request, res: Response) {
  res.json(await getDashboard(req.user!));
}

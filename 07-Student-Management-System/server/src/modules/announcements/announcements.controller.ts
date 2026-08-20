import type { Request, Response } from "express";
import { createAnnouncement, listAnnouncements } from "./announcements.service.js";
import { createAnnouncementSchema } from "./announcements.schema.js";

export async function listAnnouncementsHandler(req: Request, res: Response) {
  res.json(await listAnnouncements(req.user!));
}

export async function createAnnouncementHandler(req: Request, res: Response) {
  const input = createAnnouncementSchema.parse(req.body);
  res.status(201).json(await createAnnouncement(req.user!, input));
}

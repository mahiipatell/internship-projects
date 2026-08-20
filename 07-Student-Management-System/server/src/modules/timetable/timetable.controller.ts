import type { Request, Response } from "express";
import { createSlot, deleteSlot, listTimetable } from "./timetable.service.js";
import { createSlotSchema, timetableQuerySchema } from "./timetable.schema.js";

export async function listTimetableHandler(req: Request, res: Response) {
  const q = timetableQuerySchema.parse(req.query);
  res.json(await listTimetable(req.user!, q));
}

export async function createSlotHandler(req: Request, res: Response) {
  const input = createSlotSchema.parse(req.body);
  res.status(201).json(await createSlot(input));
}

export async function deleteSlotHandler(req: Request, res: Response) {
  await deleteSlot(req.params.id);
  res.json({ message: "deleted" });
}

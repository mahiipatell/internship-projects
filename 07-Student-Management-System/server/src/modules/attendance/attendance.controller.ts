import type { Request, Response } from "express";
import {
  listAttendance,
  markAttendance,
  updateAttendance,
} from "./attendance.service.js";
import {
  attendanceQuerySchema,
  markAttendanceSchema,
  updateAttendanceSchema,
} from "./attendance.schema.js";

export async function listAttendanceHandler(req: Request, res: Response) {
  const q = attendanceQuerySchema.parse(req.query);
  res.json(await listAttendance(req.user!, q));
}

export async function markAttendanceHandler(req: Request, res: Response) {
  const input = markAttendanceSchema.parse(req.body);
  res.status(201).json(await markAttendance(req.user!, input));
}

export async function updateAttendanceHandler(req: Request, res: Response) {
  const { status } = updateAttendanceSchema.parse(req.body);
  res.json(await updateAttendance(req.user!, req.params.id, status));
}

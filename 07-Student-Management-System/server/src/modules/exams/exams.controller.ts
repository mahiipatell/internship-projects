import type { Request, Response } from "express";
import {
  createExam,
  enterMarks,
  getMarks,
  listExams,
  publishExam,
} from "./exams.service.js";
import { createExamSchema, enterMarksSchema } from "./exams.schema.js";

export async function listExamsHandler(req: Request, res: Response) {
  res.json(await listExams(req.user!));
}

export async function createExamHandler(req: Request, res: Response) {
  const input = createExamSchema.parse(req.body);
  res.status(201).json(await createExam(req.user!, input));
}

export async function getMarksHandler(req: Request, res: Response) {
  res.json(await getMarks(req.user!, req.params.id));
}

export async function enterMarksHandler(req: Request, res: Response) {
  const { records } = enterMarksSchema.parse(req.body);
  res.json(await enterMarks(req.user!, req.params.id, records));
}

export async function publishHandler(req: Request, res: Response) {
  res.json(await publishExam(req.user!, req.params.id));
}

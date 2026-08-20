import type { Request, Response } from "express";
import {
  createAssignment,
  gradeSubmission,
  listAssignments,
  listSubmissions,
  submitAssignment,
} from "./assignments.service.js";
import {
  createAssignmentSchema,
  gradeSchema,
  submitSchema,
} from "./assignments.schema.js";

export async function listAssignmentsHandler(req: Request, res: Response) {
  res.json(await listAssignments(req.user!));
}

export async function createAssignmentHandler(req: Request, res: Response) {
  const input = createAssignmentSchema.parse(req.body);
  res.status(201).json(await createAssignment(req.user!, input));
}

export async function listSubmissionsHandler(req: Request, res: Response) {
  res.json(await listSubmissions(req.user!, req.params.id));
}

export async function submitHandler(req: Request, res: Response) {
  const input = submitSchema.parse(req.body);
  res.status(201).json(await submitAssignment(req.user!, req.params.id, input));
}

export async function gradeHandler(req: Request, res: Response) {
  const input = gradeSchema.parse(req.body);
  res.json(await gradeSubmission(req.user!, req.params.id, req.params.sid, input));
}

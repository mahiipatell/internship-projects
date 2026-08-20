import type { Request, Response } from "express";
import {
  assignToTeacher,
  createTeacher,
  deleteTeacher,
  getTeacher,
  listTeachers,
  removeAssignment,
  updateTeacher,
} from "./teachers.service.js";
import {
  assignmentSchema,
  createTeacherSchema,
  teacherQuerySchema,
  updateTeacherSchema,
} from "./teachers.schema.js";

export async function listTeachersHandler(req: Request, res: Response) {
  const { search } = teacherQuerySchema.parse(req.query);
  res.json(await listTeachers(search));
}

export async function createTeacherHandler(req: Request, res: Response) {
  const input = createTeacherSchema.parse(req.body);
  res.status(201).json(await createTeacher(input));
}

export async function getTeacherHandler(req: Request, res: Response) {
  res.json(await getTeacher(req.user!, req.params.id));
}

export async function updateTeacherHandler(req: Request, res: Response) {
  const input = updateTeacherSchema.parse(req.body);
  res.json(await updateTeacher(req.params.id, input));
}

export async function assignHandler(req: Request, res: Response) {
  const { subjectId, sectionId } = assignmentSchema.parse(req.body);
  res.status(201).json(await assignToTeacher(req.params.id, subjectId, sectionId));
}

export async function removeAssignmentHandler(req: Request, res: Response) {
  res.json(await removeAssignment(req.params.id, req.params.assignmentId));
}

export async function deleteTeacherHandler(req: Request, res: Response) {
  res.json(await deleteTeacher(req.params.id));
}

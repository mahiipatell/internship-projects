import type { Request, Response } from "express";
import {
  addClassSubject,
  createClass,
  createSection,
  createSubject,
  listClasses,
  listClassSubjects,
  listSections,
  listSubjects,
  removeClassSubject,
} from "./classes.service.js";
import {
  classSubjectSchema,
  createClassSchema,
  createSectionSchema,
  createSubjectSchema,
} from "./classes.schema.js";

export async function listClassesHandler(_req: Request, res: Response) {
  res.json(await listClasses());
}

export async function createClassHandler(req: Request, res: Response) {
  const { name } = createClassSchema.parse(req.body);
  res.status(201).json(await createClass(name));
}

export async function listSectionsHandler(req: Request, res: Response) {
  const classId = typeof req.query.classId === "string" ? req.query.classId : undefined;
  res.json(await listSections(req.user!, classId));
}

export async function createSectionHandler(req: Request, res: Response) {
  const { classId, name } = createSectionSchema.parse(req.body);
  res.status(201).json(await createSection(classId, name));
}

export async function listClassSubjectsHandler(req: Request, res: Response) {
  res.json(await listClassSubjects(req.params.id));
}

export async function addClassSubjectHandler(req: Request, res: Response) {
  const { subjectId } = classSubjectSchema.parse(req.body);
  res.status(201).json(await addClassSubject(req.params.id, subjectId));
}

export async function removeClassSubjectHandler(req: Request, res: Response) {
  res.json(await removeClassSubject(req.params.id, req.params.subjectId));
}

export async function listSubjectsHandler(_req: Request, res: Response) {
  res.json(await listSubjects());
}

export async function createSubjectHandler(req: Request, res: Response) {
  const { name, code } = createSubjectSchema.parse(req.body);
  res.status(201).json(await createSubject(name, code));
}

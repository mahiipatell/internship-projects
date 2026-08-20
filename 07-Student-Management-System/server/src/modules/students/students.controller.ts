import type { Request, Response } from "express";
import {
  createStudent,
  deactivateStudent,
  getStudent,
  getStudentMarks,
  listStudents,
  updateStudent,
} from "./students.service.js";
import { buildStudentReportData, renderStudentReportPdf } from "./student-report.service.js";
import { createStudentSchema, studentQuerySchema, updateStudentSchema } from "./students.schema.js";

export async function listStudentsHandler(req: Request, res: Response) {
  const q = studentQuerySchema.parse(req.query);
  res.json(await listStudents(req.user!, q));
}

export async function createStudentHandler(req: Request, res: Response) {
  const input = createStudentSchema.parse(req.body);
  res.status(201).json(await createStudent(input));
}

export async function getStudentHandler(req: Request, res: Response) {
  res.json(await getStudent(req.user!, req.params.id));
}

export async function getStudentMarksHandler(req: Request, res: Response) {
  res.json(await getStudentMarks(req.user!, req.params.id));
}

export async function updateStudentHandler(req: Request, res: Response) {
  const input = updateStudentSchema.parse(req.body);
  res.json(await updateStudent(req.user!, req.params.id, input));
}

export async function deactivateStudentHandler(req: Request, res: Response) {
  await deactivateStudent(req.params.id);
  res.json({ message: "Student deactivated" });
}

export async function exportStudentReportHandler(req: Request, res: Response) {
  const data = await buildStudentReportData(req.user!, req.params.id);
  const pdf = await renderStudentReportPdf(data);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="student-report-${data.student.rollNumber}.pdf"`);
  res.setHeader("Content-Length", pdf.length);
  res.send(pdf);
}

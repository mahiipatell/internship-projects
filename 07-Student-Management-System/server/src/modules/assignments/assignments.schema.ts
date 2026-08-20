import { z } from "zod";

export const createAssignmentSchema = z.object({
  subjectId: z.string().min(1),
  sectionId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  dueDate: z.string().min(1),
  maxMarks: z.coerce.number().int().min(0).optional(),
});

export const submitSchema = z.object({
  textContent: z.string().optional(),
  fileUrl: z.string().optional(),
});

export const gradeSchema = z.object({
  marksObtained: z.number().min(0).nullable(),
  feedback: z.string().optional(),
});

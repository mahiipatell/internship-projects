import { z } from "zod";

export const createExamSchema = z.object({
  subjectId: z.string().min(1),
  sectionId: z.string().min(1),
  name: z.string().min(1),
  maxMarks: z.coerce.number().int().positive(),
  examDate: z.string().optional(),
});

export const enterMarksSchema = z.object({
  records: z
    .array(
      z.object({
        studentId: z.string().min(1),
        marksObtained: z.number().min(0).nullable(),
      }),
    )
    .min(1),
});

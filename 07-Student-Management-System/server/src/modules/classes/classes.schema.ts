import { z } from "zod";

export const createClassSchema = z.object({ name: z.string().min(1) });

export const createSectionSchema = z.object({
  classId: z.string().min(1),
  name: z.string().min(1),
});

export const createSubjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
});

export const classSubjectSchema = z.object({ subjectId: z.string().min(1) });

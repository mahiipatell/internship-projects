import { z } from "zod";

export const teacherQuerySchema = z.object({
  search: z.string().optional(),
});

export const createTeacherSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const updateTeacherSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  active: z.boolean().optional(),
});

export const assignmentSchema = z.object({
  subjectId: z.string().min(1),
  sectionId: z.string().min(1),
});

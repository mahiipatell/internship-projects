import { z } from "zod";

export const timetableQuerySchema = z.object({
  sectionId: z.string().optional(),
  teacherId: z.string().optional(),
});

export const createSlotSchema = z.object({
  sectionId: z.string().min(1),
  subjectId: z.string().min(1),
  teacherId: z.string().min(1),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  period: z.coerce.number().int().min(1),
});

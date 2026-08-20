import { z } from "zod";

export const studentQuerySchema = z.object({
  search: z.string().optional(),
  sectionId: z.string().optional(),
  classId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  // 500 so a full section/class roster (attendance, marks entry) fits in one page.
  pageSize: z.coerce.number().int().min(1).max(500).default(20),
});

export const createStudentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  rollNumber: z.string().min(1).max(20),
  dob: z.string().datetime().or(z.string().refine((s) => !isNaN(Date.parse(s)))).optional(),
  sectionId: z.string().optional(),
  parentId: z.string().optional(),
});

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  rollNumber: z.string().min(1).max(20).optional(),
  dob: z.string().refine((s) => !isNaN(Date.parse(s))).optional(),
  sectionId: z.string().optional().nullable(),
  parentId: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

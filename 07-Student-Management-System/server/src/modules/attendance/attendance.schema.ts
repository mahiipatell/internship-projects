import { z } from "zod";

export const attendanceQuerySchema = z.object({
  sectionId: z.string().optional(),
  date: z.string().optional(),
  studentId: z.string().optional(),
});

export const attendanceStatus = z.enum(["PRESENT", "ABSENT", "LATE"]);

export const markAttendanceSchema = z.object({
  sectionId: z.string().min(1),
  date: z.string().min(1),
  records: z
    .array(z.object({ studentId: z.string().min(1), status: attendanceStatus }))
    .min(1),
});

export const updateAttendanceSchema = z.object({ status: attendanceStatus });

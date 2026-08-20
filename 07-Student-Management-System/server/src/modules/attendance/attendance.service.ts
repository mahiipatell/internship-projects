import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { forbidden, notFound } from "../../lib/errors.js";
import type { AttendanceStatus, Role } from "@prisma/client";

type Caller = { id: string; role: Role };

async function teacherSectionIds(teacherUserId: string): Promise<string[]> {
  const teacher = await prisma.teacher.findUnique({
    where: { userId: teacherUserId },
    select: { id: true },
  });
  if (!teacher) return [];
  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId: teacher.id },
    select: { sectionId: true },
  });
  return assignments.map((a) => a.sectionId);
}

export type AttendanceQuery = { sectionId?: string; date?: string; studentId?: string };

export async function listAttendance(caller: Caller, q: AttendanceQuery) {
  const where: Prisma.AttendanceWhereInput = {};
  if (q.sectionId) where.sectionId = q.sectionId;
  if (q.date) where.date = new Date(q.date);
  if (q.studentId) where.studentId = q.studentId;

  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    if (q.sectionId && !sectionIds.includes(q.sectionId)) {
      throw forbidden("You cannot view this section's attendance");
    }
    if (!q.sectionId) where.sectionId = { in: sectionIds };
  } else if (caller.role === "STUDENT") {
    const me = await prisma.student.findUnique({ where: { userId: caller.id }, select: { id: true } });
    if (!me) throw forbidden();
    if (q.studentId && q.studentId !== me.id) throw forbidden("You cannot view this student's attendance");
    where.studentId = me.id;
  } else if (caller.role === "PARENT") {
    const children = await prisma.student.findMany({
      where: { parentId: caller.id },
      select: { id: true },
    });
    const ids = children.map((c) => c.id);
    if (q.studentId && !ids.includes(q.studentId)) throw forbidden("You cannot view this student's attendance");
    where.studentId = q.studentId ?? { in: ids };
  }

  return prisma.attendance.findMany({
    where,
    include: { student: { include: { user: { select: { email: true } } } } },
    orderBy: { student: { firstName: "asc" } },
  });
}

export async function markAttendance(
  caller: Caller,
  input: { sectionId: string; date: string; records: { studentId: string; status: AttendanceStatus }[] },
) {
  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    if (!sectionIds.includes(input.sectionId)) {
      throw forbidden("You are not assigned to this section");
    }
  }
  const date = new Date(input.date);
  await prisma.$transaction(
    input.records.map((r) =>
      prisma.attendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date } },
        update: { status: r.status, sectionId: input.sectionId },
        create: { studentId: r.studentId, sectionId: input.sectionId, date, status: r.status },
      }),
    ),
  );
  return prisma.attendance.findMany({ where: { sectionId: input.sectionId, date } });
}

export async function updateAttendance(caller: Caller, id: string, status: AttendanceStatus) {
  const record = await prisma.attendance.findUnique({ where: { id }, select: { sectionId: true } });
  if (!record) throw notFound("Attendance record not found");
  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    if (!sectionIds.includes(record.sectionId)) throw forbidden();
  }
  return prisma.attendance.update({ where: { id }, data: { status } });
}

import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { forbidden } from "../../lib/errors.js";
import type { Role } from "@prisma/client";

type Caller = { id: string; role: Role };

const slotInclude = {
  subject: true,
  teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
  section: { include: { class: true } },
} as const;

export async function listTimetable(
  caller: Caller,
  q: { sectionId?: string; teacherId?: string },
) {
  const where: Prisma.TimetableSlotWhereInput = {};

  if (caller.role === "ADMIN") {
    if (q.sectionId) where.sectionId = q.sectionId;
    if (q.teacherId) where.teacherId = q.teacherId;
  } else if (caller.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: caller.id },
      select: { id: true },
    });
    if (!teacher) throw forbidden("No teacher profile");
    where.teacherId = teacher.id;
  } else if (caller.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: caller.id },
      select: { sectionId: true },
    });
    if (student?.sectionId) where.sectionId = student.sectionId;
  } else if (caller.role === "PARENT") {
    const children = await prisma.student.findMany({
      where: { parentId: caller.id },
      select: { sectionId: true },
    });
    const sectionIds = children.map((c) => c.sectionId).filter(Boolean) as string[];
    if (sectionIds.length) where.sectionId = { in: sectionIds };
  }

  return prisma.timetableSlot.findMany({
    where,
    include: slotInclude,
    orderBy: [{ dayOfWeek: "asc" }, { period: "asc" }],
  });
}

export async function createSlot(input: {
  sectionId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: number;
  period: number;
}) {
  return prisma.timetableSlot.create({
    data: input,
    include: slotInclude,
  });
}

export async function deleteSlot(id: string) {
  return prisma.timetableSlot.delete({ where: { id } });
}

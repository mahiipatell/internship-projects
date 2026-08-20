import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type { Role } from "@prisma/client";

type Caller = { id: string; role: Role };

export function listClasses() {
  return prisma.class.findMany({ orderBy: { name: "asc" } });
}

export function createClass(name: string) {
  return prisma.class.create({ data: { name } });
}

// Section dropdowns are built from this list, so it must respect the same
// boundary the write endpoints enforce: a teacher only sees assigned sections.
export async function listSections(caller: Caller, classId?: string) {
  const where: Prisma.SectionWhereInput = {};
  if (classId) where.classId = classId;

  if (caller.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: caller.id },
      select: { id: true },
    });
    const assignments = teacher
      ? await prisma.teacherAssignment.findMany({
          where: { teacherId: teacher.id },
          select: { sectionId: true },
        })
      : [];
    where.id = { in: assignments.map((a) => a.sectionId) };
  } else if (caller.role === "STUDENT") {
    const me = await prisma.student.findUnique({
      where: { userId: caller.id },
      select: { sectionId: true },
    });
    where.id = me?.sectionId ?? "__none__";
  } else if (caller.role === "PARENT") {
    const children = await prisma.student.findMany({
      where: { parentId: caller.id },
      select: { sectionId: true },
    });
    where.id = { in: children.map((c) => c.sectionId).filter(Boolean) as string[] };
  }

  return prisma.section.findMany({
    where,
    include: { class: true },
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
  });
}

export function createSection(classId: string, name: string) {
  return prisma.section.create({ data: { classId, name } });
}

export function listSubjects() {
  return prisma.subject.findMany({ orderBy: { name: "asc" } });
}

export function createSubject(name: string, code: string) {
  return prisma.subject.create({ data: { name, code } });
}

export function listClassSubjects(classId: string) {
  return prisma.classSubject.findMany({
    where: { classId },
    include: { subject: true },
    orderBy: { subject: { name: "asc" } },
  });
}

export function addClassSubject(classId: string, subjectId: string) {
  return prisma.classSubject.create({ data: { classId, subjectId }, include: { subject: true } });
}

export async function removeClassSubject(classId: string, subjectId: string) {
  await prisma.classSubject.delete({ where: { classId_subjectId: { classId, subjectId } } });
  return { removed: true };
}

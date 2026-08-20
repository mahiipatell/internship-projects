import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest, forbidden } from "../../lib/errors.js";
import type { Role } from "@prisma/client";

type Caller = { id: string; role: Role };

const announcementInclude = {
  author: { select: { firstName: true, lastName: true } },
  section: { include: { class: true } },
} satisfies Prisma.AnnouncementInclude;

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

export async function listAnnouncements(caller: Caller) {
  const where: Prisma.AnnouncementWhereInput = {};

  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    where.OR = [{ scope: "INSTITUTION" }, { sectionId: { in: sectionIds } }];
  } else if (caller.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: caller.id },
      select: { sectionId: true },
    });
    where.OR = [{ scope: "INSTITUTION" }, { sectionId: student?.sectionId ?? "__none__" }];
  } else if (caller.role === "PARENT") {
    const children = await prisma.student.findMany({
      where: { parentId: caller.id },
      select: { sectionId: true },
    });
    const ids = children.map((c) => c.sectionId).filter(Boolean) as string[];
    where.OR = [{ scope: "INSTITUTION" }, { sectionId: { in: ids.length ? ids : ["__none__"] } }];
  }

  return prisma.announcement.findMany({
    where,
    include: announcementInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function createAnnouncement(
  caller: Caller,
  input: { title: string; body: string; scope: "INSTITUTION" | "SECTION"; sectionId?: string },
) {
  if (input.scope === "SECTION" && !input.sectionId) {
    throw badRequest("sectionId is required for SECTION scope");
  }
  if (caller.role === "TEACHER") {
    if (input.scope !== "SECTION" || !input.sectionId) throw forbidden("Teachers can only post to their own sections");
    const sectionIds = await teacherSectionIds(caller.id);
    if (!sectionIds.includes(input.sectionId)) throw forbidden("You are not assigned to this section");
  }

  return prisma.announcement.create({
    data: {
      authorId: caller.id,
      title: input.title,
      body: input.body,
      scope: input.scope,
      sectionId: input.scope === "SECTION" ? input.sectionId! : null,
    },
    include: announcementInclude,
  });
}

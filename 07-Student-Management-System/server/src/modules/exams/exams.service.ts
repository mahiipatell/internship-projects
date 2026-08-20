import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest, forbidden, notFound } from "../../lib/errors.js";
import type { Role } from "@prisma/client";

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

const examInclude = {
  subject: true,
  section: { include: { class: true } },
  _count: { select: { marks: true } },
} satisfies Prisma.ExamInclude;

export async function listExams(caller: Caller) {
  const where: Prisma.ExamWhereInput = {};
  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    where.sectionId = { in: sectionIds };
  } else if (caller.role === "STUDENT") {
    const me = await prisma.student.findUnique({ where: { userId: caller.id }, select: { sectionId: true } });
    where.sectionId = me?.sectionId ?? "__none__";
    where.marks = { some: { published: true } };
  } else if (caller.role === "PARENT") {
    const children = await prisma.student.findMany({
      where: { parentId: caller.id },
      select: { sectionId: true },
    });
    const ids = children.map((c) => c.sectionId).filter(Boolean) as string[];
    where.sectionId = { in: ids.length ? ids : ["__none__"] };
    where.marks = { some: { published: true } };
  }
  return prisma.exam.findMany({ where, include: examInclude, orderBy: { createdAt: "desc" } });
}

export async function createExam(
  caller: Caller,
  input: { subjectId: string; sectionId: string; name: string; maxMarks: number; examDate?: string },
) {
  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    if (!sectionIds.includes(input.sectionId)) {
      throw forbidden("You are not assigned to this section");
    }
  }
  return prisma.exam.create({
    data: {
      subjectId: input.subjectId,
      sectionId: input.sectionId,
      name: input.name,
      maxMarks: input.maxMarks,
      examDate: input.examDate ? new Date(input.examDate) : null,
    },
    include: examInclude,
  });
}

export async function enterMarks(
  caller: Caller,
  examId: string,
  records: { studentId: string; marksObtained: number | null }[],
) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw notFound("Exam not found");

  const alreadyPublished = await prisma.mark.findFirst({ where: { examId, published: true } });
  if (alreadyPublished) throw badRequest("Cannot edit marks after publishing");

  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    if (!sectionIds.includes(exam.sectionId)) {
      throw forbidden("You are not assigned to this exam's section");
    }
  }

  for (const r of records) {
    if (r.marksObtained != null && r.marksObtained > exam.maxMarks) {
      throw badRequest(`Marks exceed max (${exam.maxMarks})`);
    }
  }

  await prisma.$transaction(
    records.map((r) =>
      prisma.mark.upsert({
        where: { examId_studentId: { examId, studentId: r.studentId } },
        update: { marksObtained: r.marksObtained },
        create: { examId, studentId: r.studentId, marksObtained: r.marksObtained },
      }),
    ),
  );
  return getMarks(caller, examId);
}

export async function publishExam(caller: Caller, examId: string) {
  const exam = await prisma.exam.findUnique({ where: { id: examId } });
  if (!exam) throw notFound("Exam not found");
  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    if (!sectionIds.includes(exam.sectionId)) throw forbidden();
  }
  await prisma.mark.updateMany({ where: { examId }, data: { published: true } });
  return { published: true };
}

export async function getMarks(caller: Caller, examId: string) {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      marks: {
        include: { student: { include: { user: { select: { email: true } } } } },
        orderBy: { student: { firstName: "asc" } },
      },
    },
  });
  if (!exam) throw notFound("Exam not found");

  const marks = exam.marks;
  const published = marks.length > 0 ? marks[0].published : false;

  if (caller.role === "ADMIN" || caller.role === "TEACHER") {
    if (caller.role === "TEACHER") {
      const sectionIds = await teacherSectionIds(caller.id);
      if (!sectionIds.includes(exam.sectionId)) throw forbidden();
    }
    return marks;
  }

  if (!published) throw forbidden("Results not published");

  if (caller.role === "STUDENT") {
    const me = await prisma.student.findUnique({ where: { userId: caller.id }, select: { id: true } });
    return marks.filter((m) => m.studentId === me?.id);
  }

  const children = await prisma.student.findMany({
    where: { parentId: caller.id },
    select: { id: true },
  });
  const ids = children.map((c) => c.id);
  return marks.filter((m) => ids.includes(m.studentId));
}

import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest, forbidden, notFound } from "../../lib/errors.js";
import type { Role } from "@prisma/client";

type Caller = { id: string; role: Role };

async function teacherIdForUser(userId: string): Promise<string> {
  const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
  if (!teacher) throw forbidden("No teacher profile");
  return teacher.id;
}

async function teacherSectionIds(userId: string): Promise<string[]> {
  const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
  if (!teacher) return [];
  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId: teacher.id },
    select: { sectionId: true },
  });
  return assignments.map((a) => a.sectionId);
}

async function studentIdForUser(userId: string): Promise<string | null> {
  const student = await prisma.student.findUnique({ where: { userId }, select: { id: true } });
  return student?.id ?? null;
}

const assignmentInclude = {
  subject: true,
  section: { include: { class: true } },
  teacher: { include: { user: { select: { firstName: true, lastName: true } } } },
  _count: { select: { submissions: true } },
} satisfies Prisma.AssignmentInclude;

export async function listAssignments(caller: Caller) {
  const where: Prisma.AssignmentWhereInput = {};
  if (caller.role === "TEACHER") {
    where.teacherId = await teacherIdForUser(caller.id);
  } else if (caller.role === "STUDENT") {
    const sid = await studentIdForUser(caller.id);
    const sectionId = sid ? (await prisma.student.findUnique({ where: { id: sid }, select: { sectionId: true } }))?.sectionId : null;
    where.sectionId = sectionId ?? "__none__";
  } else if (caller.role === "PARENT") {
    const children = await prisma.student.findMany({ where: { parentId: caller.id }, select: { sectionId: true } });
    const ids = children.map((c) => c.sectionId).filter(Boolean) as string[];
    where.sectionId = { in: ids.length ? ids : ["__none__"] };
  }
  return prisma.assignment.findMany({ where, include: assignmentInclude, orderBy: { dueDate: "asc" } });
}

export async function createAssignment(
  caller: Caller,
  input: { subjectId: string; sectionId: string; title: string; description?: string; dueDate: string; maxMarks?: number },
) {
  const teacherId = await teacherIdForUser(caller.id);
  if (caller.role === "TEACHER" && !(await teacherSectionIds(caller.id)).includes(input.sectionId)) {
    throw forbidden("You are not assigned to this section");
  }
  return prisma.assignment.create({
    data: {
      teacherId,
      subjectId: input.subjectId,
      sectionId: input.sectionId,
      title: input.title,
      description: input.description,
      dueDate: new Date(input.dueDate),
      maxMarks: input.maxMarks,
    },
    include: assignmentInclude,
  });
}

export async function listSubmissions(caller: Caller, assignmentId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: { submissions: { include: { student: { include: { user: { select: { email: true } } } } } } },
  });
  if (!assignment) throw notFound("Assignment not found");

  if (caller.role === "TEACHER") {
    if (assignment.teacherId !== (await teacherIdForUser(caller.id))) throw forbidden();
    return assignment.submissions;
  }
  if (caller.role === "ADMIN") return assignment.submissions;

  if (caller.role === "STUDENT") {
    const sid = await studentIdForUser(caller.id);
    return assignment.submissions.filter((s) => s.studentId === sid);
  }
  const children = await prisma.student.findMany({ where: { parentId: caller.id }, select: { id: true } });
  const ids = children.map((c) => c.id);
  return assignment.submissions.filter((s) => ids.includes(s.studentId));
}

export async function submitAssignment(caller: Caller, assignmentId: string, input: { textContent?: string; fileUrl?: string }) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw notFound("Assignment not found");
  if (new Date() > assignment.dueDate) throw badRequest("Submission deadline has passed");
  const sid = await studentIdForUser(caller.id);
  if (!sid) throw forbidden("No student profile");

  return prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId: sid } },
    update: { textContent: input.textContent, fileUrl: input.fileUrl, submittedAt: new Date() },
    create: { assignmentId, studentId: sid, textContent: input.textContent, fileUrl: input.fileUrl, submittedAt: new Date() },
  });
}

export async function gradeSubmission(
  caller: Caller,
  assignmentId: string,
  submissionId: string,
  input: { marksObtained: number | null; feedback?: string },
) {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw notFound("Assignment not found");
  if (caller.role === "TEACHER" && assignment.teacherId !== (await teacherIdForUser(caller.id))) {
    throw forbidden();
  }
  if (input.marksObtained != null && assignment.maxMarks != null && input.marksObtained > assignment.maxMarks) {
    throw badRequest(`Marks exceed max (${assignment.maxMarks})`);
  }
  return prisma.submission.update({
    where: { id: submissionId },
    data: { marksObtained: input.marksObtained, feedback: input.feedback },
  });
}

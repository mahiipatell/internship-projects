import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../../lib/password.js";
import { badRequest, forbidden, notFound } from "../../lib/errors.js";
import type { Role } from "@prisma/client";

type Caller = { id: string; role: Role };

const studentInclude = {
  user: { select: { id: true, email: true, firstName: true, lastName: true } },
  section: { include: { class: true } },
  parent: { select: { id: true, email: true, firstName: true, lastName: true } },
} satisfies Prisma.StudentInclude;

// Section ids a teacher is assigned to — the boundary for their scoped access.
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

export type StudentQuery = {
  search?: string;
  sectionId?: string;
  classId?: string;
  page: number;
  pageSize: number;
};

export async function listStudents(caller: Caller, q: StudentQuery) {
  const where: Prisma.StudentWhereInput = { active: true };

  // Directory listing is admin/teacher only (enforced at the route too); a
  // teacher is further confined to their assigned sections and cannot target
  // a section they don't teach via an explicit sectionId.
  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    if (q.sectionId) {
      if (!sectionIds.includes(q.sectionId)) {
        throw forbidden("You cannot access this section's students");
      }
      where.sectionId = q.sectionId;
    } else {
      where.sectionId = { in: sectionIds };
    }
  }

  if (q.sectionId && caller.role !== "TEACHER") where.sectionId = q.sectionId;
  if (q.classId) where.section = { classId: q.classId };
  if (q.search) {
    where.OR = [
      { firstName: { contains: q.search, mode: "insensitive" } },
      { lastName: { contains: q.search, mode: "insensitive" } },
      { user: { email: { contains: q.search, mode: "insensitive" } } },
    ];
  }

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: studentInclude,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      skip: (q.page - 1) * q.pageSize,
      take: q.pageSize,
    }),
    prisma.student.count({ where }),
  ]);

  return { data, page: q.page, pageSize: q.pageSize, total };
}

export async function createStudent(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  dob?: string;
  sectionId?: string;
  parentId?: string;
}) {
  const passwordHash = await hashPassword(input.password);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email: input.email, passwordHash, role: "STUDENT", firstName: input.firstName, lastName: input.lastName },
    });
    return tx.student.create({
      data: {
        userId: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
        rollNumber: input.rollNumber,
        dob: input.dob ? new Date(input.dob) : null,
        sectionId: input.sectionId,
        parentId: input.parentId,
      },
      include: studentInclude,
    });
  });
}

async function loadStudent(id: string) {
  const student = await prisma.student.findUnique({ where: { id }, include: studentInclude });
  if (!student) throw notFound("Student not found");
  return student;
}

// Enforces the read boundary: Admin sees all, Teacher sees assigned sections,
// Student sees self, Parent sees own child. Anything else is forbidden.
async function authorizeView(student: { sectionId: string | null; userId: string; parentId: string | null }, caller: Caller) {
  if (caller.role === "ADMIN") return;
  if (caller.role === "STUDENT" && student.userId === caller.id) return;
  if (caller.role === "PARENT" && student.parentId === caller.id) return;
  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    if (student.sectionId && sectionIds.includes(student.sectionId)) return;
  }
  throw forbidden("You cannot access this student");
}

export async function getStudent(caller: Caller, id: string) {
  const student = await loadStudent(id);
  await authorizeView(student, caller);
  return student;
}

// Enforces the write boundary. Admin edits anyone; a Teacher may only edit
// students in sections they teach; Students and Parents are rejected even though
// the route already blocks them (defence in depth — never trust the route alone).
async function authorizeEdit(student: { sectionId: string | null }, caller: Caller) {
  if (caller.role === "ADMIN") return;
  if (caller.role === "TEACHER") {
    const sectionIds = await teacherSectionIds(caller.id);
    if (student.sectionId && sectionIds.includes(student.sectionId)) return;
  }
  throw forbidden("You cannot edit this student");
}

// Marks across every exam for one student. Same view boundary as getStudent;
// students/parents additionally only ever see published results.
export async function getStudentMarks(caller: Caller, id: string) {
  const student = await loadStudent(id);
  await authorizeView(student, caller);
  const where: Prisma.MarkWhereInput = { studentId: id };
  if (caller.role === "STUDENT" || caller.role === "PARENT") where.published = true;
  return prisma.mark.findMany({
    where,
    include: { exam: { include: { subject: true } } },
    orderBy: { exam: { createdAt: "desc" } },
  });
}

export async function updateStudent(
  caller: Caller,
  id: string,
  input: {
    firstName?: string;
    lastName?: string;
    email?: string;
    dob?: string;
    rollNumber?: string;
    sectionId?: string | null;
    parentId?: string | null;
    active?: boolean;
  },
) {
  const student = await loadStudent(id);
  await authorizeEdit(student, caller);

  // A teacher cannot reassign a student to a section they don't teach.
  if (caller.role === "TEACHER" && input.sectionId) {
    const sectionIds = await teacherSectionIds(caller.id);
    if (!sectionIds.includes(input.sectionId)) {
      throw forbidden("You cannot move this student to a section you do not teach");
    }
  }

  const studentData: Prisma.StudentUncheckedUpdateInput = {};
  if (input.firstName !== undefined) studentData.firstName = input.firstName;
  if (input.lastName !== undefined) studentData.lastName = input.lastName;
  if (input.dob !== undefined) studentData.dob = input.dob ? new Date(input.dob) : null;
  if (input.sectionId !== undefined) studentData.sectionId = input.sectionId;
  if (input.parentId !== undefined) studentData.parentId = input.parentId;
  if (input.rollNumber !== undefined) studentData.rollNumber = input.rollNumber;
  if (input.active !== undefined) studentData.active = input.active;

  // Email and name live on the User record; keep both in sync.
  const userData: Prisma.UserUpdateInput = {};
  if (input.firstName !== undefined) userData.firstName = input.firstName;
  if (input.lastName !== undefined) userData.lastName = input.lastName;
  if (input.email !== undefined) userData.email = input.email;

  try {
    return await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length) {
        await tx.user.update({ where: { id: student.userId }, data: userData });
      }
      return tx.student.update({ where: { id }, data: studentData, include: studentInclude });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw badRequest("A student with this roll number already exists in the section");
    }
    throw e;
  }
}

export async function deactivateStudent(id: string) {
  await loadStudent(id);
  return prisma.student.update({ where: { id }, data: { active: false } });
}

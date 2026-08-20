import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../../lib/password.js";
import { badRequest, conflict, forbidden, notFound } from "../../lib/errors.js";
import type { Role } from "@prisma/client";

type Caller = { id: string; role: Role };

const teacherInclude = {
  user: { select: { id: true, email: true, firstName: true, lastName: true, active: true } },
  teacherAssignments: {
    include: { subject: true, section: { include: { class: true } } },
  },
} satisfies Prisma.TeacherInclude;

export async function listTeachers(search?: string) {
  const where: Prisma.TeacherWhereInput = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { user: { email: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};
  return prisma.teacher.findMany({
    where,
    include: teacherInclude,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

export async function createTeacher(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const passwordHash = await hashPassword(input.password);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        role: "TEACHER",
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });
    return tx.teacher.create({
      data: { userId: user.id, firstName: input.firstName, lastName: input.lastName },
      include: teacherInclude,
    });
  });
}

async function loadTeacher(id: string) {
  const teacher = await prisma.teacher.findUnique({ where: { id }, include: teacherInclude });
  if (!teacher) throw notFound("Teacher not found");
  return teacher;
}

export async function getTeacher(caller: Caller, id: string) {
  const teacher = await loadTeacher(id);
  if (caller.role === "ADMIN") return teacher;
  if (caller.role === "TEACHER" && teacher.userId === caller.id) return teacher;
  throw forbidden("You cannot access this teacher");
}

export async function updateTeacher(
  id: string,
  input: { firstName?: string; lastName?: string; email?: string; active?: boolean },
) {
  const teacher = await loadTeacher(id);

  const teacherData: Prisma.TeacherUncheckedUpdateInput = {};
  if (input.firstName !== undefined) teacherData.firstName = input.firstName;
  if (input.lastName !== undefined) teacherData.lastName = input.lastName;

  const userData: Prisma.UserUpdateInput = {};
  if (input.firstName !== undefined) userData.firstName = input.firstName;
  if (input.lastName !== undefined) userData.lastName = input.lastName;
  if (input.email !== undefined) userData.email = input.email;
  if (input.active !== undefined) userData.active = input.active;

  try {
    return await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length) {
        await tx.user.update({ where: { id: teacher.userId }, data: userData });
      }
      if (Object.keys(teacherData).length) {
        return tx.teacher.update({ where: { id }, data: teacherData, include: teacherInclude });
      }
      return tx.teacher.findUniqueOrThrow({ where: { id }, include: teacherInclude });
    });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw badRequest("A user with this email already exists");
    }
    throw e;
  }
}

export async function assignToTeacher(teacherId: string, subjectId: string, sectionId: string) {
  await loadTeacher(teacherId);
  return prisma.teacherAssignment.create({ data: { teacherId, subjectId, sectionId } });
}

export async function removeAssignment(teacherId: string, assignmentId: string) {
  const assignment = await prisma.teacherAssignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw notFound("Assignment not found");
  if (assignment.teacherId !== teacherId) throw forbidden("Assignment does not belong to this teacher");
  await prisma.teacherAssignment.delete({ where: { id: assignmentId } });
  return { message: "Assignment removed" };
}

// Hard delete only after academic links are cleared. Assignment.teacherId and
// TimetableSlot.teacherId have no cascade, so leaving them would FK-block the
// deletion; we surface a clean conflict instead of silently cascading data away.
export async function deleteTeacher(id: string) {
  const teacher = await loadTeacher(id);
  const [authored, slots] = await Promise.all([
    prisma.assignment.count({ where: { teacherId: id } }),
    prisma.timetableSlot.count({ where: { teacherId: id } }),
  ]);
  if (authored > 0 || slots > 0) {
    throw conflict("Cannot delete this teacher because they have linked assignments or timetable entries. Remove those first.");
  }
  // Deleting the User cascades to the Teacher row and its refresh tokens.
  await prisma.user.delete({ where: { id: teacher.userId } });
  return { message: "Teacher deleted" };
}

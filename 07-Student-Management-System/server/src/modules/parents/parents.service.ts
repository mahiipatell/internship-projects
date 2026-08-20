import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { hashPassword } from "../../lib/password.js";
import { badRequest, conflict, notFound } from "../../lib/errors.js";

// A parent is a User with role PARENT; students link to it via Student.parentId.
const parentSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  active: true,
  children: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      rollNumber: true,
      user: { select: { email: true } },
      section: { select: { name: true, class: { select: { name: true } } } },
    },
  },
} satisfies Prisma.UserSelect;

export async function listParents(search?: string) {
  const where: Prisma.UserWhereInput = { role: "PARENT" };
  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" } },
      { lastName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }
  return prisma.user.findMany({
    where,
    select: parentSelect,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });
}

async function loadParent(id: string) {
  const parent = await prisma.user.findUnique({ where: { id, role: "PARENT" }, select: parentSelect });
  if (!parent) throw notFound("Parent not found");
  return parent;
}

export async function getParent(id: string) {
  return loadParent(id);
}

export async function createParent(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const passwordHash = await hashPassword(input.password);
  return prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      role: "PARENT",
      firstName: input.firstName,
      lastName: input.lastName,
    },
    select: parentSelect,
  });
}

export async function updateParent(
  id: string,
  input: { firstName?: string; lastName?: string; email?: string; active?: boolean },
) {
  await loadParent(id);
  try {
    return await prisma.user.update({ where: { id }, data: input, select: parentSelect });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      throw badRequest("A user with this email already exists");
    }
    throw e;
  }
}

// Hard delete is only allowed when no students are linked. Student.parent has no
// onDelete, so an FK violation would otherwise block it; we check first to return
// a clean conflict telling the admin to reassign or unlink the children.
export async function deleteParent(id: string) {
  await loadParent(id);
  const linked = await prisma.student.count({ where: { parentId: id } });
  if (linked > 0) {
    throw conflict("Cannot delete a parent with linked children. Reassign or unlink the children first.");
  }
  await prisma.user.delete({ where: { id } });
  return { message: "Parent deleted" };
}

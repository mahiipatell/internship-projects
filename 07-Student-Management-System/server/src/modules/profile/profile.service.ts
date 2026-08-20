import { prisma } from "../../lib/prisma.js";
import { comparePassword, hashPassword } from "../../lib/password.js";
import { badRequest } from "../../lib/errors.js";
import type { Role } from "@prisma/client";

type Caller = { id: string; role: Role };

const profileSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  student: { include: { section: { include: { class: true } }, parent: { select: { firstName: true, lastName: true, email: true } } } },
  teacher: true,
} as const;

export async function getProfile(caller: Caller) {
  return prisma.user.findUniqueOrThrow({ where: { id: caller.id }, select: profileSelect });
}

export async function updateProfile(caller: Caller, input: { firstName?: string; lastName?: string }) {
  const data: { firstName?: string; lastName?: string } = {};
  if (input.firstName) data.firstName = input.firstName;
  if (input.lastName) data.lastName = input.lastName;
  if (Object.keys(data).length === 0) return getProfile(caller);

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id: caller.id }, data, select: profileSelect });
    // Keep the linked profile name in sync.
    if (user.student) {
      await tx.student.update({ where: { id: user.student.id }, data });
    } else if (user.teacher) {
      await tx.teacher.update({ where: { id: user.teacher.id }, data });
    }
    return user;
  });
}

export async function changePassword(caller: Caller, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: caller.id } });
  const ok = await comparePassword(currentPassword, user.passwordHash);
  if (!ok) throw badRequest("Current password is incorrect");
  await prisma.user.update({
    where: { id: caller.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
}

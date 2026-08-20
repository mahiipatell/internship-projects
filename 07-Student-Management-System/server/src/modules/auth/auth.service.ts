import crypto from "crypto";
import { prisma } from "../../lib/prisma.js";
import { comparePassword, hashPassword } from "../../lib/password.js";
import {
  generateRefreshToken,
  hashToken,
  refreshTokenExpiry,
  signAccessToken,
} from "../../lib/tokens.js";
import { badRequest, unauthorized } from "../../lib/errors.js";

export type PublicUser = {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
};

function toPublic(u: {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
}): PublicUser {
  return { id: u.id, email: u.email, role: u.role, firstName: u.firstName, lastName: u.lastName };
}

async function issueTokens(user: { id: string; email: string; role: string }) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role, email: user.email });
  const raw = generateRefreshToken();
  await prisma.refreshToken.create({
    data: { userId: user.id, tokenHash: hashToken(raw), expiresAt: refreshTokenExpiry() },
  });
  return { accessToken, refreshTokenRaw: raw };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw unauthorized("Invalid credentials");
  if (user.active === false) throw unauthorized("This account is inactive");
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw unauthorized("Invalid credentials");
  const tokens = await issueTokens(user);
  return { ...tokens, user: toPublic(user) };
}

export async function refresh(raw: string | undefined) {
  if (!raw) throw unauthorized("Missing refresh token");
  const record = await prisma.refreshToken.findFirst({ where: { tokenHash: hashToken(raw) } });
  const now = new Date();
  if (!record || record.revokedAt || record.expiresAt < now) {
    throw unauthorized("Invalid or expired refresh token");
  }
  // Rotate: revoke the used token, issue a fresh pair.
  await prisma.refreshToken.update({ where: { id: record.id }, data: { revokedAt: now } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: record.userId } });
  if (user.active === false) throw unauthorized("This account is inactive");
  const tokens = await issueTokens(user);
  return { ...tokens, user: toPublic(user) };
}

export async function logout(raw: string | undefined) {
  if (!raw) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(raw), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function forgotPassword(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null; // do not reveal account existence
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: user.id },
    data: { resetTokenHash: hashToken(token), resetTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });
  return token; // dev only; in production this is emailed, not returned
}

export async function resetPassword(token: string, password: string) {
  const user = await prisma.user.findFirst({ where: { resetTokenHash: hashToken(token) } });
  if (!user || !user.resetTokenExpiresAt || user.resetTokenExpiresAt < new Date()) {
    throw badRequest("Invalid or expired reset token");
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password),
      resetTokenHash: null,
      resetTokenExpiresAt: null,
    },
  });
}

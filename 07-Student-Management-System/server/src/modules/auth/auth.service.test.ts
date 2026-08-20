import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma.js";
import * as auth from "./auth.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), findFirst: vi.fn(), update: vi.fn() },
    refreshToken: { create: vi.fn(), findFirst: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.user.findUnique).mockResolvedValue(null);
  m(prisma.user.findUniqueOrThrow).mockResolvedValue({ id: "u1", email: "a@b.c", role: "ADMIN" });
  m(prisma.user.findFirst).mockResolvedValue(null);
  m(prisma.user.update).mockResolvedValue({});
  m(prisma.refreshToken.create).mockResolvedValue({});
  m(prisma.refreshToken.findFirst).mockResolvedValue(null);
  m(prisma.refreshToken.update).mockResolvedValue({});
  m(prisma.refreshToken.updateMany).mockResolvedValue({});
});

describe("login", () => {
  it("rejects an unknown email", async () => {
    await expect(auth.login("nobody@sms.test", "x")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("rejects a wrong password", async () => {
    m(prisma.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.c", role: "ADMIN", passwordHash: await bcrypt.hash("right", 10) });
    await expect(auth.login("a@b.c", "wrong")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("issues tokens and stores a refresh record for valid credentials", async () => {
    m(prisma.user.findUnique).mockResolvedValue({ id: "u1", email: "a@b.c", role: "ADMIN", passwordHash: await bcrypt.hash("right", 10) });
    const res = await auth.login("a@b.c", "right");
    expect(res.accessToken).toBeTruthy();
    expect(res.refreshTokenRaw).toBeTruthy();
    expect(res.user.role).toBe("ADMIN");
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
  });
});

describe("refresh", () => {
  const stored = (overrides: Record<string, unknown> = {}) => ({
    id: "rt1",
    revokedAt: null,
    expiresAt: new Date(Date.now() + 60_000),
    userId: "u1",
    ...overrides,
  });

  it("rejects a missing refresh token", async () => {
    await expect(auth.refresh(undefined)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an unknown token", async () => {
    await expect(auth.refresh("raw")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an already-revoked token", async () => {
    m(prisma.refreshToken.findFirst).mockResolvedValue(stored({ revokedAt: new Date() }));
    await expect(auth.refresh("raw")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects an expired token", async () => {
    m(prisma.refreshToken.findFirst).mockResolvedValue(stored({ expiresAt: new Date(Date.now() - 60_000) }));
    await expect(auth.refresh("raw")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rotates the token and issues a fresh pair", async () => {
    m(prisma.refreshToken.findFirst).mockResolvedValue(stored());
    const res = await auth.refresh("raw");
    expect(res.accessToken).toBeTruthy();
    expect(prisma.refreshToken.update).toHaveBeenCalledWith({ where: { id: "rt1" }, data: { revokedAt: expect.any(Date) } });
    expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
  });
});

describe("inactive accounts", () => {
  it("refuses login for an inactive account", async () => {
    m(prisma.user.findUnique).mockResolvedValue({
      id: "u1", email: "a@b.c", role: "ADMIN", active: false, passwordHash: await bcrypt.hash("right", 10),
    });
    await expect(auth.login("a@b.c", "right")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it("refuses refresh for an inactive account", async () => {
    m(prisma.refreshToken.findFirst).mockResolvedValue({
      id: "rt1", revokedAt: null, expiresAt: new Date(Date.now() + 60_000), userId: "u1",
    });
    m(prisma.user.findUniqueOrThrow).mockResolvedValue({ id: "u1", email: "a@b.c", role: "ADMIN", active: false });
    await expect(auth.refresh("raw")).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    // the used token is revoked, but no new token pair is issued
    expect(prisma.refreshToken.create).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("does nothing without a token", async () => {
    await auth.logout(undefined);
    expect(prisma.refreshToken.updateMany).not.toHaveBeenCalled();
  });

  it("revokes the stored token", async () => {
    await auth.logout("raw");
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: expect.any(String), revokedAt: null } }),
    );
  });
});

describe("forgotPassword", () => {
  it("returns null and makes no change for an unknown account", async () => {
    const token = await auth.forgotPassword("nobody@sms.test");
    expect(token).toBeNull();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns a reset token and stores its hash", async () => {
    m(prisma.user.findUnique).mockResolvedValue({ id: "u1" });
    const token = await auth.forgotPassword("a@b.c");
    expect(token).toBeTruthy();
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" }, data: expect.objectContaining({ resetTokenHash: expect.any(String) }) }),
    );
  });
});

describe("resetPassword", () => {
  it("rejects an unknown or expired token", async () => {
    await expect(auth.resetPassword("bad", "password123")).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("hashes the new password and clears the reset fields", async () => {
    m(prisma.user.findFirst).mockResolvedValue({ id: "u1", resetTokenExpiresAt: new Date(Date.now() + 60_000) });
    await auth.resetPassword("bad", "password123");
    const call = m(prisma.user.update).mock.calls[0][0];
    expect(call.data.passwordHash).not.toBe("password123");
    expect(await bcrypt.compare("password123", call.data.passwordHash)).toBe(true);
    expect(call.data.resetTokenHash).toBeNull();
    expect(call.data.resetTokenExpiresAt).toBeNull();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import * as parents from "./parents.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: { findMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn() },
    student: { count: vi.fn() },
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

const parent = { id: "p1", email: "p@x.test", firstName: "P", lastName: "X", active: true, children: [] };

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.user.findMany).mockResolvedValue([]);
  m(prisma.user.create).mockResolvedValue({});
  m(prisma.user.findUnique).mockResolvedValue(parent);
  m(prisma.user.update).mockResolvedValue({});
  m(prisma.user.delete).mockResolvedValue({});
  m(prisma.student.count).mockResolvedValue(0);
});

describe("listParents", () => {
  it("only returns users with the PARENT role", async () => {
    await parents.listParents();
    expect(prisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "PARENT" } }),
    );
  });

  it("adds a case-insensitive search across name and email", async () => {
    await parents.listParents("ann");
    const where = m(prisma.user.findMany).mock.calls[0][0].where;
    expect(where.role).toBe("PARENT");
    expect(where.OR).toHaveLength(3);
    expect(where.OR[2]).toEqual({ email: { contains: "ann", mode: "insensitive" } });
  });
});

describe("createParent", () => {
  it("hashes the password and stores the PARENT role", async () => {
    await parents.createParent({ email: "p@x.test", password: "password123", firstName: "P", lastName: "X" });
    const data = m(prisma.user.create).mock.calls[0][0].data;
    expect(data.role).toBe("PARENT");
    expect(data.email).toBe("p@x.test");
    expect(data.passwordHash).not.toBe("password123");
  });
});

describe("getParent", () => {
  it("throws NOT_FOUND when the parent is missing", async () => {
    m(prisma.user.findUnique).mockResolvedValue(null);
    await expect(parents.getParent("p1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("updateParent", () => {
  it("updates name, email and active on the user", async () => {
    await parents.updateParent("p1", { firstName: "A", email: "a@x.test", active: false });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "p1" }, data: { firstName: "A", email: "a@x.test", active: false } }),
    );
  });

  it("surfaces a duplicate email as a bad request", async () => {
    m(prisma.user.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }),
    );
    await expect(parents.updateParent("p1", { email: "taken@x.test" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("deleteParent", () => {
  it("rejects deletion while children are linked", async () => {
    m(prisma.student.count).mockResolvedValue(2);
    await expect(parents.deleteParent("p1")).rejects.toMatchObject({ code: "CONFLICT" });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("deletes the user when no children remain", async () => {
    m(prisma.student.count).mockResolvedValue(0);
    await parents.deleteParent("p1");
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
  });
});

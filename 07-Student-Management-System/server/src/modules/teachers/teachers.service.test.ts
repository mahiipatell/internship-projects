import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import * as teachers from "./teachers.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    teacher: { findUnique: vi.fn(), findUniqueOrThrow: vi.fn(), create: vi.fn(), update: vi.fn() },
    user: { create: vi.fn(), update: vi.fn(), delete: vi.fn() },
    teacherAssignment: { create: vi.fn(), findUnique: vi.fn(), delete: vi.fn() },
    assignment: { count: vi.fn() },
    timetableSlot: { count: vi.fn() },
    $transaction: vi.fn((fn: any) => fn(prisma)),
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

const teacher = {
  id: "t1",
  userId: "u1",
  firstName: "Roshni",
  lastName: "Math",
  user: { id: "u1", email: "r@x.test", firstName: "Roshni", lastName: "Math", active: true },
  teacherAssignments: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.teacher.findUnique).mockResolvedValue(teacher);
  m(prisma.teacher.findUniqueOrThrow).mockResolvedValue(teacher);
  m(prisma.teacher.create).mockResolvedValue(teacher);
  m(prisma.teacher.update).mockResolvedValue(teacher);
  m(prisma.user.create).mockResolvedValue({ id: "u1" });
  m(prisma.user.update).mockResolvedValue({});
  m(prisma.user.delete).mockResolvedValue({});
  m(prisma.teacherAssignment.create).mockResolvedValue({});
  m(prisma.teacherAssignment.findUnique).mockResolvedValue({ id: "a1", teacherId: "t1" });
  m(prisma.teacherAssignment.delete).mockResolvedValue({});
  m(prisma.assignment.count).mockResolvedValue(0);
  m(prisma.timetableSlot.count).mockResolvedValue(0);
});

describe("updateTeacher", () => {
  it("updates name on both teacher and user, and email/active on the user", async () => {
    await teachers.updateTeacher("t1", { firstName: "R", email: "r2@x.test", active: false });
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "u1" }, data: { firstName: "R", email: "r2@x.test", active: false } }),
    );
    expect(prisma.teacher.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "t1" }, data: { firstName: "R" } }),
    );
  });

  it("surfaces a duplicate email as a bad request", async () => {
    m(prisma.user.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }),
    );
    await expect(teachers.updateTeacher("t1", { email: "taken@x.test" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("removeAssignment", () => {
  it("deletes an assignment that belongs to the teacher", async () => {
    await teachers.removeAssignment("t1", "a1");
    expect(prisma.teacherAssignment.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
  });

  it("throws NOT_FOUND for an unknown assignment", async () => {
    m(prisma.teacherAssignment.findUnique).mockResolvedValue(null);
    await expect(teachers.removeAssignment("t1", "a1")).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(prisma.teacherAssignment.delete).not.toHaveBeenCalled();
  });

  it("forbids removing an assignment that belongs to another teacher", async () => {
    m(prisma.teacherAssignment.findUnique).mockResolvedValue({ id: "a1", teacherId: "other" });
    await expect(teachers.removeAssignment("t1", "a1")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.teacherAssignment.delete).not.toHaveBeenCalled();
  });
});

describe("deleteTeacher", () => {
  it("rejects deletion while the teacher has authored assignments", async () => {
    m(prisma.assignment.count).mockResolvedValue(1);
    await expect(teachers.deleteTeacher("t1")).rejects.toMatchObject({ code: "CONFLICT" });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("rejects deletion while the teacher has timetable slots", async () => {
    m(prisma.timetableSlot.count).mockResolvedValue(1);
    await expect(teachers.deleteTeacher("t1")).rejects.toMatchObject({ code: "CONFLICT" });
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it("deletes the linked user when no academic records remain", async () => {
    await teachers.deleteTeacher("t1");
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "u1" } });
  });
});

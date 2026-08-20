import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../lib/prisma.js";
import * as attendance from "./attendance.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    attendance: { findMany: vi.fn(), findUnique: vi.fn(), update: vi.fn(), upsert: vi.fn() },
    student: { findUnique: vi.fn(), findMany: vi.fn() },
    teacher: { findUnique: vi.fn() },
    teacherAssignment: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.attendance.findMany).mockResolvedValue([]);
  m(prisma.attendance.findUnique).mockResolvedValue(null);
  m(prisma.attendance.update).mockResolvedValue({});
  m(prisma.attendance.upsert).mockResolvedValue({});
  m(prisma.student.findUnique).mockResolvedValue(null);
  m(prisma.student.findMany).mockResolvedValue([]);
  m(prisma.teacher.findUnique).mockResolvedValue({ id: "t1" });
  m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "s1" }]);
  m(prisma.$transaction).mockResolvedValue([]);
});

const admin = { id: "admin", role: "ADMIN" as const };
const teacher = { id: "teacher-user", role: "TEACHER" as const };
const student = { id: "student-user", role: "STUDENT" as const };
const parent = { id: "parent-user", role: "PARENT" as const };

describe("listAttendance", () => {
  it("admin filters by explicit query params", async () => {
    await attendance.listAttendance(admin, { sectionId: "s1", date: "2026-08-01", studentId: "x" });
    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ sectionId: "s1", date: new Date("2026-08-01"), studentId: "x" }),
      }),
    );
  });

  it("forbids a teacher viewing a section they are not assigned to", async () => {
    m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "other" }]);
    await expect(attendance.listAttendance(teacher, { sectionId: "s1" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("scopes a teacher with no section param to their sections", async () => {
    await attendance.listAttendance(teacher, {});
    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: { in: ["s1"] } } }),
    );
  });

  it("scopes a student to their own id", async () => {
    m(prisma.student.findUnique).mockResolvedValue({ id: "s-x" });
    await attendance.listAttendance(student, {});
    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: "s-x" } }),
    );
  });

  it("forbids a student querying another student's attendance", async () => {
    m(prisma.student.findUnique).mockResolvedValue({ id: "s-x" });
    await expect(attendance.listAttendance(student, { studentId: "s-other" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("lets a parent narrow to one of their children", async () => {
    m(prisma.student.findMany).mockResolvedValue([{ id: "s-x" }, { id: "s-y" }]);
    await attendance.listAttendance(parent, { studentId: "s-y" });
    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: "s-y" } }),
    );
  });

  it("forbids a parent querying a student who is not their child", async () => {
    m(prisma.student.findMany).mockResolvedValue([{ id: "s-x" }]);
    await expect(attendance.listAttendance(parent, { studentId: "s-other" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("forbids a student with no profile", async () => {
    await expect(attendance.listAttendance(student, {})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("scopes a parent to their children's ids", async () => {
    m(prisma.student.findMany).mockResolvedValue([{ id: "s-x" }, { id: "s-y" }]);
    await attendance.listAttendance(parent, {});
    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: { in: ["s-x", "s-y"] } } }),
    );
  });
});

describe("markAttendance", () => {
  it("forbids a teacher not assigned to the section", async () => {
    m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "other" }]);
    await expect(
      attendance.markAttendance(teacher, { sectionId: "s1", date: "2026-08-01", records: [] }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("upserts each record and returns the section's attendance", async () => {
    await attendance.markAttendance(teacher, {
      sectionId: "s1",
      date: "2026-08-01",
      records: [{ studentId: "x", status: "PRESENT" }],
    });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.attendance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId_date: { studentId: "x", date: new Date("2026-08-01") } },
        create: expect.objectContaining({ status: "PRESENT", sectionId: "s1" }),
        update: expect.objectContaining({ status: "PRESENT", sectionId: "s1" }),
      }),
    );
    expect(prisma.attendance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: "s1", date: new Date("2026-08-01") } }),
    );
  });
});

describe("updateAttendance", () => {
  it("throws NOT_FOUND when the record is missing", async () => {
    await expect(attendance.updateAttendance(admin, "rec1", "LATE")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("forbids a teacher not assigned to the record's section", async () => {
    m(prisma.attendance.findUnique).mockResolvedValue({ sectionId: "s-other" });
    m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "s1" }]);
    await expect(attendance.updateAttendance(teacher, "rec1", "LATE")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("updates the status", async () => {
    m(prisma.attendance.findUnique).mockResolvedValue({ sectionId: "s1" });
    await attendance.updateAttendance(admin, "rec1", "LATE");
    expect(prisma.attendance.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "rec1" }, data: { status: "LATE" } }),
    );
  });
});

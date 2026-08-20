import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../lib/prisma.js";
import * as timetable from "./timetable.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    timetableSlot: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    student: { findUnique: vi.fn(), findMany: vi.fn() },
    teacher: { findUnique: vi.fn() },
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.timetableSlot.findMany).mockResolvedValue([]);
  m(prisma.timetableSlot.create).mockResolvedValue({});
  m(prisma.timetableSlot.delete).mockResolvedValue({});
  m(prisma.student.findUnique).mockResolvedValue(null);
  m(prisma.student.findMany).mockResolvedValue([]);
  m(prisma.teacher.findUnique).mockResolvedValue({ id: "t1" });
});

const admin = { id: "admin", role: "ADMIN" as const };
const teacher = { id: "teacher-user", role: "TEACHER" as const };
const student = { id: "student-user", role: "STUDENT" as const };
const parent = { id: "parent-user", role: "PARENT" as const };

describe("listTimetable", () => {
  it("admin may filter by any section", async () => {
    await timetable.listTimetable(admin, { sectionId: "s1" });
    expect(prisma.timetableSlot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: "s1" } }),
    );
  });

  it("scopes a teacher to their own teacher id", async () => {
    await timetable.listTimetable(teacher, {});
    expect(prisma.timetableSlot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teacherId: "t1" } }),
    );
  });

  it("scopes a student to their own section", async () => {
    m(prisma.student.findUnique).mockResolvedValue({ sectionId: "secA" });
    await timetable.listTimetable(student, {});
    expect(prisma.timetableSlot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: "secA" } }),
    );
  });

  it("ignores a student-supplied sectionId and keeps their own", async () => {
    m(prisma.student.findUnique).mockResolvedValue({ sectionId: "secA" });
    await timetable.listTimetable(student, { sectionId: "other" });
    const where = m(prisma.timetableSlot.findMany).mock.calls[0][0].where;
    expect(where.sectionId).toBe("secA");
  });

  it("scopes a parent to their children's sections", async () => {
    m(prisma.student.findMany).mockResolvedValue([{ sectionId: "s1" }, { sectionId: "s2" }]);
    await timetable.listTimetable(parent, {});
    expect(prisma.timetableSlot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: { in: ["s1", "s2"] } } }),
    );
  });
});

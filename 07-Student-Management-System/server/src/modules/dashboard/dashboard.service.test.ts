import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../lib/prisma.js";
import { getDashboard } from "./dashboard.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    student: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
    mark: { groupBy: vi.fn(), findMany: vi.fn() },
    teacher: { count: vi.fn(), findUnique: vi.fn() },
    teacherAssignment: { findMany: vi.fn() },
    class: { count: vi.fn() },
    attendance: { findMany: vi.fn() },
    assignment: { findMany: vi.fn() },
    timetableSlot: { findMany: vi.fn() },
    exam: { findMany: vi.fn() },
    announcement: { findMany: vi.fn() },
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.student.findMany).mockResolvedValue([]);
  m(prisma.student.findUnique).mockResolvedValue(null);
  m(prisma.mark.groupBy).mockResolvedValue([]);
  m(prisma.mark.findMany).mockResolvedValue([]);
  m(prisma.teacher.findUnique).mockResolvedValue({ id: "t1" });
  m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "s1" }]);
  m(prisma.timetableSlot.findMany).mockResolvedValue([]);
  m(prisma.exam.findMany).mockResolvedValue([]);
  m(prisma.announcement.findMany).mockResolvedValue([]);
});

const parent = { id: "parent-user", role: "PARENT" as const };
const teacher = { id: "teacher-user", role: "TEACHER" as const };
const student = { id: "student-user", role: "STUDENT" as const };

describe("teacher dashboard", () => {
  it("lists exams in assigned sections with nothing published", async () => {
    m(prisma.exam.findMany).mockResolvedValue([{ id: "e1" }]);
    const res: any = await getDashboard(teacher);
    expect(prisma.exam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { sectionId: { in: ["s1"] }, marks: { none: { published: true } } },
      }),
    );
    expect(res.examsNeedingMarks).toHaveLength(1);
  });

  it("returns empty lists when the caller has no teacher profile", async () => {
    m(prisma.teacher.findUnique).mockResolvedValue(null);
    expect(await getDashboard(teacher)).toEqual({ todayClasses: [], examsNeedingMarks: [] });
    expect(prisma.exam.findMany).not.toHaveBeenCalled();
  });
});

const child = (id: string, statuses: string[]) => ({
  id,
  firstName: "Kid",
  lastName: id,
  section: { name: "A", class: { name: "Grade 1" } },
  attendances: statuses.map((status) => ({ status })),
});

describe("parent dashboard", () => {
  it("uses a single grouped marks query for all children", async () => {
    m(prisma.student.findMany).mockResolvedValue([child("c1", []), child("c2", [])]);
    await getDashboard(parent);
    expect(prisma.mark.groupBy).toHaveBeenCalledTimes(1);
    expect(prisma.mark.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["studentId"],
        where: expect.objectContaining({ studentId: { in: ["c1", "c2"] }, published: true }),
      }),
    );
  });

  it("skips the marks query entirely when there are no children", async () => {
    const res = await getDashboard(parent);
    expect(prisma.mark.groupBy).not.toHaveBeenCalled();
    expect(res).toEqual({ children: [] });
  });

  it("maps averages and attendance back onto each child", async () => {
    m(prisma.student.findMany).mockResolvedValue([
      child("c1", ["PRESENT", "ABSENT"]),
      child("c2", []),
    ]);
    m(prisma.mark.groupBy).mockResolvedValue([{ studentId: "c1", _avg: { marksObtained: 72.4 } }]);
    const res: any = await getDashboard(parent);
    expect(res.children[0]).toMatchObject({ id: "c1", attendancePct: 50, avgMarks: 72, section: "Grade 1 - A" });
    expect(res.children[1]).toMatchObject({ id: "c2", attendancePct: 0, avgMarks: null });
  });
});

describe("student dashboard", () => {
  const me = (sectionId: string) => ({
    id: "s-x",
    firstName: "Sam",
    lastName: "Student",
    sectionId,
    section: sectionId ? { id: sectionId, name: "A", class: { id: "c1", name: "Grade 10" } } : null,
    attendances: [{ status: "PRESENT" }, { status: "ABSENT" }, { status: "LATE" }],
  });

  function seedStudent(sectionId = "secA") {
    m(prisma.student.findUnique).mockResolvedValue(me(sectionId));
  }

  it("scopes every query to the student's own section/id", async () => {
    seedStudent("secA");
    await getDashboard(student);

    // Own assignments only (section + future due).
    expect(prisma.assignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: "secA", dueDate: { gte: expect.any(Date) } } }),
    );
    // Own upcoming exams only (section + future date).
    expect(prisma.exam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: "secA", examDate: { gte: expect.any(Date) } } }),
    );
    // Own published marks only.
    expect(prisma.mark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { studentId: "s-x", published: true },
        include: { exam: { include: { subject: true } } },
      }),
    );
    // Institution-wide + own section announcements only.
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ scope: "INSTITUTION" }, { sectionId: "secA" }] },
      }),
    );
  });

  it("computes attendance counts from the student's own records", async () => {
    seedStudent("secA");
    const res: any = await getDashboard(student);
    expect(res.attendance).toMatchObject({ present: 1, absent: 1, late: 1, total: 3, pct: 33 });
  });

  it("returns the student's identity and section", async () => {
    seedStudent("secA");
    const res: any = await getDashboard(student);
    expect(res.student).toMatchObject({
      firstName: "Sam",
      lastName: "Student",
      section: { name: "A", class: { name: "Grade 10" } },
    });
  });

  it("handles a student with no section/profile gracefully", async () => {
    m(prisma.student.findUnique).mockResolvedValue(null);
    const res: any = await getDashboard(student);
    expect(res.student).toBeNull();
    expect(res.attendance).toEqual({ pct: 0, present: 0, absent: 0, late: 0, total: 0 });
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: [{ scope: "INSTITUTION" }, { sectionId: "__none__" }] } }),
    );
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import * as students from "./students.service.js";
import * as report from "./student-report.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    student: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
    teacher: { findUnique: vi.fn() },
    teacherAssignment: { findMany: vi.fn() },
    mark: { findMany: vi.fn() },
    attendance: { findMany: vi.fn() },
    submission: { findMany: vi.fn() },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.student.findMany).mockResolvedValue([]);
  m(prisma.student.count).mockResolvedValue(0);
  m(prisma.student.findUnique).mockResolvedValue(null);
  m(prisma.student.update).mockResolvedValue({});
  m(prisma.user.update).mockResolvedValue({});
  m(prisma.teacher.findUnique).mockResolvedValue({ id: "t1" });
  m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "s1" }, { sectionId: "s2" }]);
  m(prisma.mark.findMany).mockResolvedValue([]);
  m(prisma.attendance.findMany).mockResolvedValue([]);
  m(prisma.submission.findMany).mockResolvedValue([]);
  m(prisma.$transaction).mockImplementation(async (fn: any) => fn(prisma));
});

const admin = { id: "admin", role: "ADMIN" as const };
const teacher = { id: "teacher-user", role: "TEACHER" as const };
const student = { id: "student-user", role: "STUDENT" as const };
const parent = { id: "parent-user", role: "PARENT" as const };

describe("listStudents", () => {
  it("admin is not confined to any section", async () => {
    await students.listStudents(admin, { page: 1, pageSize: 20 });
    expect(prisma.teacherAssignment.findMany).not.toHaveBeenCalled();
    expect(prisma.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ active: true }) }),
    );
  });

  it("scopes a teacher with no section param to their assigned sections", async () => {
    await students.listStudents(teacher, { page: 1, pageSize: 20 });
    expect(prisma.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ sectionId: { in: ["s1", "s2"] } }) }),
    );
  });

  it("lets a teacher narrow to an assigned section", async () => {
    await students.listStudents(teacher, { sectionId: "s1", page: 1, pageSize: 20 });
    expect(prisma.student.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ sectionId: "s1" }) }),
    );
  });

  it("forbids a teacher from listing a section they are not assigned to", async () => {
    await expect(students.listStudents(teacher, { sectionId: "sX", page: 1, pageSize: 20 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.student.findMany).not.toHaveBeenCalled();
  });
});

describe("getStudentMarks", () => {
  const row = { id: "st1", userId: "student-user", sectionId: "s1", parentId: "parent-user" };

  it("throws NOT_FOUND when the student is missing", async () => {
    await expect(students.getStudentMarks(admin, "st1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("admin sees unpublished marks too", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row);
    await students.getStudentMarks(admin, "st1");
    expect(prisma.mark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: "st1" } }),
    );
  });

  it("a student only sees their own published marks", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row);
    await students.getStudentMarks(student, "st1");
    expect(prisma.mark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: "st1", published: true } }),
    );
  });

  it("a parent only sees their child's published marks", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row);
    await students.getStudentMarks(parent, "st1");
    expect(prisma.mark.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { studentId: "st1", published: true } }),
    );
  });

  it("forbids a parent who is not the student's parent", async () => {
    m(prisma.student.findUnique).mockResolvedValue({ ...row, parentId: "someone-else" });
    await expect(students.getStudentMarks(parent, "st1")).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.mark.findMany).not.toHaveBeenCalled();
  });

  it("forbids a teacher outside the student's section", async () => {
    m(prisma.student.findUnique).mockResolvedValue({ ...row, sectionId: "sX" });
    await expect(students.getStudentMarks(teacher, "st1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("getStudent parent visibility", () => {
  const withParent = {
    id: "st1",
    userId: "u-st1",
    parentId: "p1",
    sectionId: "s1",
    rollNumber: "10A-01",
    firstName: "Sam",
    lastName: "Student",
    parent: { id: "p1", firstName: "P", lastName: "Parent", email: "p@sms.test" },
  };

  it("returns the assigned parent to an authorized teacher", async () => {
    m(prisma.student.findUnique).mockResolvedValue(withParent);
    const r = await students.getStudent(teacher, "st1");
    expect(r.parent).toMatchObject({ id: "p1", email: "p@sms.test" });
  });

  it("returns the assigned parent to an admin", async () => {
    m(prisma.student.findUnique).mockResolvedValue(withParent);
    const r = await students.getStudent(admin, "st1");
    expect(r.parent).toMatchObject({ id: "p1", email: "p@sms.test" });
  });
});

const studentRow = (over: any = {}) => ({
  id: "st1",
  userId: "u-st1",
  parentId: "p1",
  sectionId: "s1",
  rollNumber: "10A-01",
  firstName: "Sam",
  lastName: "Student",
  ...over,
});

describe("updateStudent authorization", () => {
  it("lets an admin edit any student", async () => {
    m(prisma.student.findUnique).mockResolvedValue(studentRow());
    await students.updateStudent(admin, "st1", { firstName: "Samuel" });
    expect(prisma.student.update).toHaveBeenCalled();
  });

  it("lets an admin activate or deactivate a student via the active flag", async () => {
    m(prisma.student.findUnique).mockResolvedValue(studentRow());
    await students.updateStudent(admin, "st1", { active: false });
    expect(prisma.student.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ active: false }) }),
    );
    await students.updateStudent(admin, "st1", { active: true });
    expect(prisma.student.update).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ active: true }) }),
    );
  });

  it("lets a teacher edit a student in their section", async () => {
    m(prisma.student.findUnique).mockResolvedValue(studentRow({ sectionId: "s1" }));
    await students.updateStudent(teacher, "st1", { firstName: "X" });
    expect(prisma.student.update).toHaveBeenCalled();
  });

  it("forbids a teacher editing a student outside their sections", async () => {
    m(prisma.student.findUnique).mockResolvedValue(studentRow({ sectionId: "sX" }));
    await expect(students.updateStudent(teacher, "st1", { firstName: "X" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.student.update).not.toHaveBeenCalled();
  });

  it("forbids a teacher reassigning a student to a section they don't teach", async () => {
    m(prisma.student.findUnique).mockResolvedValue(studentRow({ sectionId: "s1" }));
    await expect(students.updateStudent(teacher, "st1", { sectionId: "s9" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a student caller (defence in depth; route already blocks)", async () => {
    m(prisma.student.findUnique).mockResolvedValue(studentRow());
    await expect(students.updateStudent(student, "st1", { firstName: "X" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a parent caller", async () => {
    m(prisma.student.findUnique).mockResolvedValue(studentRow());
    await expect(students.updateStudent(parent, "st1", { firstName: "X" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("surfaces a duplicate roll number as a bad request", async () => {
    m(prisma.student.findUnique).mockResolvedValue(studentRow());
    m(prisma.$transaction).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", { code: "P2002", clientVersion: "6" }),
    );
    await expect(students.updateStudent(admin, "st1", { rollNumber: "DUP" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("buildStudentReportData authorization", () => {
  const row = (over: any = {}) => ({
    id: "st1",
    userId: "u-st1",
    parentId: "p1",
    sectionId: "s1",
    rollNumber: "10A-01",
    firstName: "Sam",
    lastName: "Student",
    user: { email: "sam@sms.test" },
    section: { name: "A", class: { name: "Grade 10" } },
    parent: { firstName: "P", lastName: "Parent", email: "p@sms.test" },
    ...over,
  });

  let allMarks: any[] = [];
  const marks = (published: boolean[]) =>
    published.map((p, i) => ({
      exam: { name: `Exam${i}`, maxMarks: 100, examDate: new Date(), subject: { name: "Math" } },
      marksObtained: 70,
      published: p,
    }));

  beforeEach(() => {
    allMarks = [];
    m(prisma.attendance.findMany).mockResolvedValue([
      { status: "PRESENT" },
      { status: "ABSENT" },
      { status: "PRESENT" },
    ]);
    m(prisma.submission.findMany).mockResolvedValue([]);
    m(prisma.mark.findMany).mockImplementation(async (args: any) =>
      args?.where?.published === true ? allMarks.filter((x) => x.published) : allMarks,
    );
  });

  it("admin builds a report with the roll number and attendance", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row());
    allMarks = marks([true, false]);
    const r = await report.buildStudentReportData(admin, "st1");
    expect(r.student.rollNumber).toBe("10A-01");
    expect(r.attendance).toMatchObject({ present: 2, absent: 1, total: 3, pct: 67 });
  });

  it("teacher in the section can build the report", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row({ sectionId: "s1" }));
    const r = await report.buildStudentReportData(teacher, "st1");
    expect(r.student.rollNumber).toBe("10A-01");
  });

  it("teacher outside the section is forbidden", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row({ sectionId: "sX" }));
    await expect(report.buildStudentReportData(teacher, "st1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("student can build their own report", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row({ userId: "student-user" }));
    allMarks = marks([true]);
    const r = await report.buildStudentReportData(student, "st1");
    expect(r.student.rollNumber).toBe("10A-01");
  });

  it("student cannot build another student's report", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row({ userId: "other-user" }));
    await expect(report.buildStudentReportData(student, "st1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("parent can build their linked child's report", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row({ parentId: "parent-user" }));
    const r = await report.buildStudentReportData(parent, "st1");
    expect(r.student.rollNumber).toBe("10A-01");
  });

  it("parent cannot build an unrelated student's report", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row({ parentId: "someone-else" }));
    await expect(report.buildStudentReportData(parent, "st1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("requests only published marks for a student and excludes the rest", async () => {
    m(prisma.student.findUnique).mockResolvedValue(row({ userId: "student-user" }));
    allMarks = marks([true, false]);
    const r = await report.buildStudentReportData(student, "st1");
    expect(m(prisma.mark.findMany).mock.calls[0][0].where.published).toBe(true);
    expect(r.marks).toHaveLength(1);
  });
});

describe("renderStudentReportPdf", () => {
  it("produces a PDF buffer", async () => {
    const buf = await report.renderStudentReportPdf({
      student: {
        firstName: "Sam",
        lastName: "Student",
        email: "sam@sms.test",
        rollNumber: "10A-01",
        section: { name: "A", class: { name: "Grade 10" } },
        parent: null,
      },
      attendance: { present: 1, absent: 0, late: 0, total: 1, pct: 100 },
      marks: [],
      assignments: [],
      generatedAt: new Date().toISOString(),
    });
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.slice(0, 4).toString()).toBe("%PDF");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../lib/prisma.js";
import * as exams from "./exams.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    exam: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
    mark: { findFirst: vi.fn(), updateMany: vi.fn(), upsert: vi.fn() },
    student: { findUnique: vi.fn(), findMany: vi.fn() },
    teacher: { findUnique: vi.fn() },
    teacherAssignment: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.$transaction).mockResolvedValue([]);
  m(prisma.mark.upsert).mockResolvedValue({});
  m(prisma.exam.findUnique).mockResolvedValue({ id: "e1", sectionId: "s1", maxMarks: 100, marks: [] });
  m(prisma.exam.findMany).mockResolvedValue([]);
  m(prisma.exam.create).mockResolvedValue({});
  m(prisma.mark.findFirst).mockResolvedValue(null);
  m(prisma.mark.updateMany).mockResolvedValue({});
  m(prisma.student.findUnique).mockResolvedValue(null);
  m(prisma.student.findMany).mockResolvedValue([]);
  m(prisma.teacher.findUnique).mockResolvedValue({ id: "t1" });
  m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "s1" }]);
});

const admin = { id: "admin", role: "ADMIN" as const };
const teacher = { id: "teacher-user", role: "TEACHER" as const };
const student = { id: "student-user", role: "STUDENT" as const };
const parent = { id: "parent-user", role: "PARENT" as const };

describe("listExams", () => {
  it("admin sees all exams (no section scoping)", async () => {
    await exams.listExams(admin);
    expect(prisma.exam.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    expect(prisma.teacher.findUnique).not.toHaveBeenCalled();
  });

  it("teacher is scoped to assigned sections", async () => {
    await exams.listExams(teacher);
    expect(prisma.exam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: { in: ["s1"] } } }),
    );
  });

  it("teacher with no assignments gets an empty scope", async () => {
    m(prisma.teacher.findUnique).mockResolvedValue(null);
    await exams.listExams(teacher);
    expect(prisma.exam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: { in: [] } } }),
    );
  });

  it("student sees only published exams in their section", async () => {
    m(prisma.student.findUnique).mockResolvedValue({ sectionId: "s9" });
    await exams.listExams(student);
    expect(prisma.exam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: "s9", marks: { some: { published: true } } } }),
    );
  });

  it("parent sees published exams for children's sections", async () => {
    m(prisma.student.findMany).mockResolvedValue([{ sectionId: "s1" }, { sectionId: "s2" }]);
    await exams.listExams(parent);
    expect(prisma.exam.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: { in: ["s1", "s2"] }, marks: { some: { published: true } } } }),
    );
  });
});

describe("createExam", () => {
  it("parses a provided examDate string into a Date", async () => {
    await exams.createExam(admin, { subjectId: "sub", sectionId: "sec", name: "Mid", maxMarks: 100, examDate: "2026-07-15" });
    expect(prisma.exam.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ examDate: new Date("2026-07-15") }) }),
    );
  });

  it("stores null when examDate is omitted", async () => {
    await exams.createExam(admin, { subjectId: "sub", sectionId: "sec", name: "Mid", maxMarks: 100 });
    expect(prisma.exam.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ examDate: null }) }),
    );
  });

  it("forbids a teacher from creating an exam for a section they are not assigned to", async () => {
    await expect(exams.createExam(teacher, { subjectId: "sub", sectionId: "other", name: "Mid", maxMarks: 100 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.exam.create).not.toHaveBeenCalled();
  });
});

describe("enterMarks", () => {
  it("throws NOT_FOUND when the exam is missing", async () => {
    m(prisma.exam.findUnique).mockResolvedValue(null);
    await expect(exams.enterMarks(admin, "e1", [{ studentId: "x", marksObtained: 10 }]))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("blocks edits after marks are published", async () => {
    m(prisma.mark.findFirst).mockResolvedValue({ id: "m1" });
    await expect(exams.enterMarks(admin, "e1", [{ studentId: "x", marksObtained: 10 }]))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("forbids a teacher not assigned to the section", async () => {
    m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "other" }]);
    await expect(exams.enterMarks(teacher, "e1", [{ studentId: "x", marksObtained: 10 }]))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects marks above the maximum", async () => {
    await expect(exams.enterMarks(teacher, "e1", [{ studentId: "x", marksObtained: 150 }]))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("upserts marks and returns getMarks", async () => {
    await exams.enterMarks(teacher, "e1", [{ studentId: "x", marksObtained: 50 }]);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.mark.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { examId_studentId: { examId: "e1", studentId: "x" } },
        create: expect.objectContaining({ marksObtained: 50 }),
        update: expect.objectContaining({ marksObtained: 50 }),
      }),
    );
  });
});

describe("publishExam", () => {
  it("throws NOT_FOUND when the exam is missing", async () => {
    m(prisma.exam.findUnique).mockResolvedValue(null);
    await expect(exams.publishExam(admin, "e1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("forbids a teacher not assigned to the section", async () => {
    m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "other" }]);
    await expect(exams.publishExam(teacher, "e1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("publishes all marks and returns { published: true }", async () => {
    const res = await exams.publishExam(teacher, "e1");
    expect(prisma.mark.updateMany).toHaveBeenCalledWith({ where: { examId: "e1" }, data: { published: true } });
    expect(res).toEqual({ published: true });
  });
});

describe("getMarks", () => {
  it("throws NOT_FOUND when the exam is missing", async () => {
    m(prisma.exam.findUnique).mockResolvedValue(null);
    await expect(exams.getMarks(admin, "e1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("admin gets all marks", async () => {
    m(prisma.exam.findUnique).mockResolvedValue({ id: "e1", sectionId: "s1", maxMarks: 100, marks: [{ id: "m1" }] });
    expect(await exams.getMarks(admin, "e1")).toHaveLength(1);
  });

  it("forbids a teacher not assigned to the section", async () => {
    m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "other" }]);
    await expect(exams.getMarks(teacher, "e1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("forbids a student when results are unpublished", async () => {
    m(prisma.exam.findUnique).mockResolvedValue({ id: "e1", sectionId: "s1", maxMarks: 100, marks: [{ published: false, studentId: "s-x" }] });
    m(prisma.student.findUnique).mockResolvedValue({ id: "s-x" });
    await expect(exams.getMarks(student, "e1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("student sees only their own published marks", async () => {
    m(prisma.exam.findUnique).mockResolvedValue({
      id: "e1", sectionId: "s1", maxMarks: 100,
      marks: [{ published: true, studentId: "s-x" }, { published: true, studentId: "s-other" }],
    });
    m(prisma.student.findUnique).mockResolvedValue({ id: "s-x" });
    const res = await exams.getMarks(student, "e1");
    expect(res).toHaveLength(1);
    expect(res[0].studentId).toBe("s-x");
  });

  it("parent sees only their children's published marks", async () => {
    m(prisma.exam.findUnique).mockResolvedValue({
      id: "e1", sectionId: "s1", maxMarks: 100,
      marks: [{ published: true, studentId: "s-x" }, { published: true, studentId: "s-other" }],
    });
    m(prisma.student.findMany).mockResolvedValue([{ id: "s-x" }]);
    const res = await exams.getMarks(parent, "e1");
    expect(res).toHaveLength(1);
    expect(res[0].studentId).toBe("s-x");
  });
});

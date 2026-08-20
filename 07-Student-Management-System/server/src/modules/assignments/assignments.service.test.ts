import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../lib/prisma.js";
import * as assignments from "./assignments.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    assignment: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    submission: { upsert: vi.fn(), update: vi.fn() },
    student: { findUnique: vi.fn(), findMany: vi.fn() },
    teacher: { findUnique: vi.fn() },
    teacherAssignment: { findMany: vi.fn() },
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.assignment.findMany).mockResolvedValue([]);
  m(prisma.assignment.findUnique).mockResolvedValue(null);
  m(prisma.assignment.create).mockResolvedValue({});
  m(prisma.assignment.update).mockResolvedValue({});
  m(prisma.submission.upsert).mockResolvedValue({});
  m(prisma.student.findUnique).mockResolvedValue(null);
  m(prisma.student.findMany).mockResolvedValue([]);
  m(prisma.teacher.findUnique).mockResolvedValue({ id: "t1" });
  m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "sec" }]);
});

const admin = { id: "admin", role: "ADMIN" as const };
const teacher = { id: "teacher-user", role: "TEACHER" as const };
const student = { id: "student-user", role: "STUDENT" as const };
const parent = { id: "parent-user", role: "PARENT" as const };

describe("listAssignments", () => {
  it("admin sees all assignments", async () => {
    await assignments.listAssignments(admin);
    expect(prisma.assignment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
    expect(prisma.teacher.findUnique).not.toHaveBeenCalled();
  });

  it("teacher is scoped to their teacher id", async () => {
    await assignments.listAssignments(teacher);
    expect(prisma.assignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teacherId: "t1" } }),
    );
  });

  it("student is scoped to their section", async () => {
    m(prisma.student.findUnique).mockResolvedValueOnce({ id: "s5", sectionId: "s5" });
    m(prisma.student.findUnique).mockResolvedValueOnce({ id: "s5", sectionId: "s5" });
    await assignments.listAssignments(student);
    expect(prisma.assignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: "s5" } }),
    );
  });

  it("parent is scoped to children's sections", async () => {
    m(prisma.student.findMany).mockResolvedValue([{ sectionId: "s5" }, { sectionId: "s6" }]);
    await assignments.listAssignments(parent);
    expect(prisma.assignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { sectionId: { in: ["s5", "s6"] } } }),
    );
  });
});

describe("createAssignment", () => {
  it("forbids a caller with no teacher profile", async () => {
    m(prisma.teacher.findUnique).mockResolvedValue(null);
    await expect(
      assignments.createAssignment(teacher, { subjectId: "s", sectionId: "sec", title: "T", dueDate: "2026-08-01" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  // The route is TEACHER-only because Assignment.teacherId is required and an
  // admin has no teacher profile; this pins the service half of that contract.
  it("rejects a caller with no teacher profile", async () => {
    m(prisma.teacher.findUnique).mockResolvedValue(null);
    await expect(
      assignments.createAssignment(admin, { subjectId: "s", sectionId: "sec", title: "T", dueDate: "2026-08-01" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.assignment.create).not.toHaveBeenCalled();
  });

  it("forbids a teacher creating an assignment for a section they are not assigned to", async () => {
    m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "other" }]);
    await expect(
      assignments.createAssignment(teacher, { subjectId: "s", sectionId: "sec", title: "T", dueDate: "2026-08-01" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.assignment.create).not.toHaveBeenCalled();
  });

  it("parses dueDate into a Date and records the teacher id", async () => {
    await assignments.createAssignment(teacher, { subjectId: "s", sectionId: "sec", title: "T", dueDate: "2026-08-01" });
    expect(prisma.assignment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ teacherId: "t1", dueDate: new Date("2026-08-01") }),
      }),
    );
  });
});

describe("listSubmissions", () => {
  const assignment = (teacherId: string, subs: unknown[] = []) => ({ teacherId, submissions: subs });

  it("throws NOT_FOUND when the assignment is missing", async () => {
    await expect(assignments.listSubmissions(admin, "a1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("forbids a teacher who does not own the assignment", async () => {
    m(prisma.assignment.findUnique).mockResolvedValue(assignment("t-other"));
    await expect(assignments.listSubmissions(teacher, "a1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("admin gets all submissions", async () => {
    m(prisma.assignment.findUnique).mockResolvedValue(assignment("t1", [{ id: "sub1" }, { id: "sub2" }]));
    const res = await assignments.listSubmissions(admin, "a1");
    expect(res).toHaveLength(2);
  });

  it("student sees only their own submissions", async () => {
    m(prisma.assignment.findUnique).mockResolvedValue(
      assignment("t1", [{ studentId: "s-x" }, { studentId: "s-other" }]),
    );
    m(prisma.student.findUnique).mockResolvedValue({ id: "s-x" });
    const res = await assignments.listSubmissions(student, "a1");
    expect(res).toHaveLength(1);
    expect(res[0].studentId).toBe("s-x");
  });

  it("parent sees only their children's submissions", async () => {
    m(prisma.assignment.findUnique).mockResolvedValue(
      assignment("t1", [{ studentId: "s-x" }, { studentId: "s-other" }]),
    );
    m(prisma.student.findMany).mockResolvedValue([{ id: "s-x" }]);
    const res = await assignments.listSubmissions(parent, "a1");
    expect(res).toHaveLength(1);
    expect(res[0].studentId).toBe("s-x");
  });
});

describe("submitAssignment", () => {
  it("throws NOT_FOUND when the assignment is missing", async () => {
    await expect(assignments.submitAssignment(student, "a1", { textContent: "hi" }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("rejects submissions after the deadline", async () => {
    m(prisma.assignment.findUnique).mockResolvedValue({ dueDate: new Date("2020-01-01") });
    m(prisma.student.findUnique).mockResolvedValue({ id: "s-x" });
    await expect(assignments.submitAssignment(student, "a1", { textContent: "hi" }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("forbids a caller with no student profile", async () => {
    m(prisma.assignment.findUnique).mockResolvedValue({ dueDate: new Date("2999-01-01") });
    await expect(assignments.submitAssignment(student, "a1", { textContent: "hi" }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("upserts the student's submission", async () => {
    m(prisma.assignment.findUnique).mockResolvedValue({ dueDate: new Date("2999-01-01") });
    m(prisma.student.findUnique).mockResolvedValue({ id: "s-x" });
    await assignments.submitAssignment(student, "a1", { textContent: "hi", fileUrl: "u" });
    expect(prisma.submission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { assignmentId_studentId: { assignmentId: "a1", studentId: "s-x" } },
        create: expect.objectContaining({ textContent: "hi", fileUrl: "u" }),
        update: expect.objectContaining({ textContent: "hi", fileUrl: "u" }),
      }),
    );
  });
});

describe("gradeSubmission", () => {
  it("throws NOT_FOUND when the assignment is missing", async () => {
    await expect(assignments.gradeSubmission(teacher, "a1", "sub1", { marksObtained: 10 }))
      .rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("forbids a teacher who does not own the assignment", async () => {
    m(prisma.assignment.findUnique).mockResolvedValue({ teacherId: "t-other", maxMarks: 100 });
    await expect(assignments.gradeSubmission(teacher, "a1", "sub1", { marksObtained: 10 }))
      .rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects marks above the maximum", async () => {
    m(prisma.assignment.findUnique).mockResolvedValue({ teacherId: "t1", maxMarks: 50 });
    await expect(assignments.gradeSubmission(teacher, "a1", "sub1", { marksObtained: 90 }))
      .rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("updates the submission with marks and feedback", async () => {
    m(prisma.assignment.findUnique).mockResolvedValue({ teacherId: "t1", maxMarks: 100 });
    await assignments.gradeSubmission(teacher, "a1", "sub1", { marksObtained: 80, feedback: "good" });
    expect(prisma.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "sub1" }, data: { marksObtained: 80, feedback: "good" } }),
    );
  });
});

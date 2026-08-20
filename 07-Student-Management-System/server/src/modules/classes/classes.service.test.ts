import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../lib/prisma.js";
import * as classes from "./classes.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    classSubject: { findMany: vi.fn(), create: vi.fn(), delete: vi.fn() },
    section: { findMany: vi.fn() },
    student: { findUnique: vi.fn(), findMany: vi.fn() },
    teacher: { findUnique: vi.fn() },
    teacherAssignment: { findMany: vi.fn() },
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.classSubject.findMany).mockResolvedValue([]);
  m(prisma.classSubject.create).mockResolvedValue({});
  m(prisma.classSubject.delete).mockResolvedValue({});
  m(prisma.section.findMany).mockResolvedValue([]);
  m(prisma.student.findUnique).mockResolvedValue(null);
  m(prisma.student.findMany).mockResolvedValue([]);
  m(prisma.teacher.findUnique).mockResolvedValue({ id: "t1" });
  m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "s1" }]);
});

const admin = { id: "admin", role: "ADMIN" as const };
const teacher = { id: "teacher-user", role: "TEACHER" as const };
const student = { id: "student-user", role: "STUDENT" as const };
const parent = { id: "parent-user", role: "PARENT" as const };

describe("listSections", () => {
  it("admin sees every section", async () => {
    await classes.listSections(admin);
    expect(prisma.section.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it("keeps the classId filter", async () => {
    await classes.listSections(admin, "c1");
    expect(prisma.section.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { classId: "c1" } }),
    );
  });

  it("teacher only sees assigned sections", async () => {
    await classes.listSections(teacher);
    expect(prisma.section.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["s1"] } } }),
    );
  });

  it("teacher with no profile gets an empty scope", async () => {
    m(prisma.teacher.findUnique).mockResolvedValue(null);
    await classes.listSections(teacher);
    expect(prisma.section.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: [] } } }),
    );
  });

  it("student only sees their own section", async () => {
    m(prisma.student.findUnique).mockResolvedValue({ sectionId: "s9" });
    await classes.listSections(student);
    expect(prisma.section.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "s9" } }),
    );
  });

  it("parent only sees their children's sections", async () => {
    m(prisma.student.findMany).mockResolvedValue([{ sectionId: "s1" }, { sectionId: null }]);
    await classes.listSections(parent);
    expect(prisma.section.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ["s1"] } } }),
    );
  });
});

describe("class ↔ subject mapping", () => {
  it("lists only the requested class's subjects", async () => {
    await classes.listClassSubjects("c1");
    expect(prisma.classSubject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { classId: "c1" } }),
    );
  });

  it("adds a mapping", async () => {
    await classes.addClassSubject("c1", "sub1");
    expect(prisma.classSubject.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { classId: "c1", subjectId: "sub1" } }),
    );
  });

  it("removes a mapping by its composite key", async () => {
    expect(await classes.removeClassSubject("c1", "sub1")).toEqual({ removed: true });
    expect(prisma.classSubject.delete).toHaveBeenCalledWith({
      where: { classId_subjectId: { classId: "c1", subjectId: "sub1" } },
    });
  });
});

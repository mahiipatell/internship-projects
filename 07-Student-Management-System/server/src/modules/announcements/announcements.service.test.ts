import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../lib/prisma.js";
import * as announcements from "./announcements.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    announcement: { findMany: vi.fn(), create: vi.fn() },
    student: { findUnique: vi.fn(), findMany: vi.fn() },
    teacher: { findUnique: vi.fn() },
    teacherAssignment: { findMany: vi.fn() },
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.announcement.findMany).mockResolvedValue([]);
  m(prisma.announcement.create).mockResolvedValue({});
  m(prisma.student.findUnique).mockResolvedValue(null);
  m(prisma.student.findMany).mockResolvedValue([]);
  m(prisma.teacher.findUnique).mockResolvedValue({ id: "t1" });
  m(prisma.teacherAssignment.findMany).mockResolvedValue([{ sectionId: "s1" }]);
});

const admin = { id: "admin", role: "ADMIN" as const };
const teacher = { id: "teacher-user", role: "TEACHER" as const };
const student = { id: "student-user", role: "STUDENT" as const };
const parent = { id: "parent-user", role: "PARENT" as const };

describe("listAnnouncements", () => {
  // Regression: the client read author.user.firstName while the include selects
  // firstName/lastName straight off the author User, so every render threw and
  // the page went blank. Lock the shape the client consumes.
  it("selects the author's name directly on author (not author.user)", async () => {
    await announcements.listAnnouncements(admin);
    const include = m(prisma.announcement.findMany).mock.calls[0][0].include;
    expect(include.author).toEqual({ select: { firstName: true, lastName: true } });
    expect(include.author.select).not.toHaveProperty("user");
  });

  it("admin sees every announcement", async () => {
    await announcements.listAnnouncements(admin);
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {} }));
  });

  it("teacher sees institution-wide plus their own sections", async () => {
    await announcements.listAnnouncements(teacher);
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ scope: "INSTITUTION" }, { sectionId: { in: ["s1"] } }] },
      }),
    );
  });

  it("student sees institution-wide plus their own section", async () => {
    m(prisma.student.findUnique).mockResolvedValue({ sectionId: "s9" });
    await announcements.listAnnouncements(student);
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { OR: [{ scope: "INSTITUTION" }, { sectionId: "s9" }] } }),
    );
  });

  it("parent with no children still only sees institution-wide posts", async () => {
    await announcements.listAnnouncements(parent);
    expect(prisma.announcement.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ scope: "INSTITUTION" }, { sectionId: { in: ["__none__"] } }] },
      }),
    );
  });
});

describe("createAnnouncement", () => {
  it("requires a sectionId for SECTION scope", async () => {
    await expect(
      announcements.createAnnouncement(admin, { title: "t", body: "b", scope: "SECTION" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("forbids a teacher posting institution-wide", async () => {
    await expect(
      announcements.createAnnouncement(teacher, { title: "t", body: "b", scope: "INSTITUTION" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("forbids a teacher posting to a section they are not assigned to", async () => {
    await expect(
      announcements.createAnnouncement(teacher, { title: "t", body: "b", scope: "SECTION", sectionId: "other" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("nulls the sectionId on an institution-wide post", async () => {
    await announcements.createAnnouncement(admin, { title: "t", body: "b", scope: "INSTITUTION", sectionId: "s1" });
    expect(prisma.announcement.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sectionId: null, authorId: "admin" }) }),
    );
  });
});

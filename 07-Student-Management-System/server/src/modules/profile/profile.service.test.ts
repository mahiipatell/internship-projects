import { describe, it, expect, vi, beforeEach } from "vitest";
import { prisma } from "../../lib/prisma.js";
import * as profile from "./profile.service.js";

vi.mock("../../lib/prisma.js", () => ({
  prisma: {
    user: { findUniqueOrThrow: vi.fn(), update: vi.fn() },
    student: { update: vi.fn() },
    teacher: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

const m = (fn: any) => vi.mocked(fn) as any;

const userFixture = {
  id: "u1",
  email: "sam.student@sms.test",
  role: "STUDENT",
  firstName: "Sam",
  lastName: "Student",
  student: {
    id: "s1",
    firstName: "Sam",
    lastName: "Student",
    section: { id: "secA", name: "A", class: { id: "c1", name: "Grade 10" } },
    parent: { firstName: "Patty", lastName: "Parent", email: "parent@sms.test" },
  },
  teacher: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  m(prisma.user.findUniqueOrThrow).mockResolvedValue(userFixture);
  m(prisma.user.update).mockImplementation(async () => userFixture);
  m(prisma.student.update).mockResolvedValue({});
  m(prisma.teacher.update).mockResolvedValue({});
  m(prisma.$transaction).mockImplementation(async (fn: any) => fn(prisma));
});

const student = { id: "u1", role: "STUDENT" as const };

describe("getProfile", () => {
  it("returns the student's section and parent as read-only context", async () => {
    const res: any = await profile.getProfile(student);
    expect(res.student.section).toMatchObject({ name: "A", class: { name: "Grade 10" } });
    expect(res.student.parent).toMatchObject({ email: "parent@sms.test" });
  });
});

describe("updateProfile", () => {
  it("updates only first/last name and never role or section", async () => {
    await profile.updateProfile(student, { firstName: "Samuel", lastName: "Student" });
    const data = m(prisma.user.update).mock.calls[0][0].data;
    expect(data).toEqual({ firstName: "Samuel", lastName: "Student" });
    expect(data).not.toHaveProperty("role");
    expect(data).not.toHaveProperty("sectionId");
    expect(data).not.toHaveProperty("classId");
  });

  it("syncs the linked student name", async () => {
    await profile.updateProfile(student, { firstName: "Sammy" });
    expect(prisma.student.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { firstName: "Sammy" },
    });
  });

  it("returns the profile unchanged when no fields are supplied", async () => {
    m(prisma.user.update).mockClear();
    const res: any = await profile.updateProfile(student, {});
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(res.id).toBe("u1");
  });
});

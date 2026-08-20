import { describe, it, expect } from "vitest";
import { studentQuerySchema, createStudentSchema, updateStudentSchema } from "./students.schema.js";

// Regression: Attendance and the Exams marks panel fetch a whole section roster
// with pageSize=200. A max of 100 rejected that with VALIDATION_ERROR, so both
// pages rendered "No students in this section" on seeded data.
describe("studentQuerySchema", () => {
  it("accepts the roster pageSize=200 the attendance/marks screens send", () => {
    expect(studentQuerySchema.parse({ sectionId: "s1", pageSize: "200" })).toMatchObject({
      sectionId: "s1",
      page: 1,
      pageSize: 200,
    });
  });

  it("defaults page/pageSize when omitted", () => {
    expect(studentQuerySchema.parse({})).toMatchObject({ page: 1, pageSize: 20 });
  });

  it("still rejects an unbounded pageSize", () => {
    expect(() => studentQuerySchema.parse({ pageSize: "5000" })).toThrow();
  });

  it("rejects a non-positive pageSize", () => {
    expect(() => studentQuerySchema.parse({ pageSize: "0" })).toThrow();
  });
});

describe("createStudentSchema", () => {
  const base = {
    email: "new.student@sms.test",
    password: "password123",
    firstName: "New",
    lastName: "Student",
  };

  it("requires a roll number", () => {
    expect(() => createStudentSchema.parse(base)).toThrow();
  });

  it("accepts a valid roll number", () => {
    expect(createStudentSchema.parse({ ...base, rollNumber: "10A-07" })).toMatchObject({ rollNumber: "10A-07" });
  });

  it("rejects an over-long roll number", () => {
    expect(() => createStudentSchema.parse({ ...base, rollNumber: "x".repeat(21) })).toThrow();
  });
});

describe("updateStudentSchema", () => {
  it("accepts roll number, email and active together", () => {
    expect(updateStudentSchema.parse({ rollNumber: "10A-07", email: "a@sms.test", active: false })).toMatchObject({
      rollNumber: "10A-07",
      email: "a@sms.test",
      active: false,
    });
  });

  it("rejects an invalid email", () => {
    expect(() => updateStudentSchema.parse({ email: "not-an-email" })).toThrow();
  });
});

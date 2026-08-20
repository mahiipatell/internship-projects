import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { requireRole } from "./rbac.js";

function run(allowed: string[], userRole: string | null, next: NextFunction) {
  const req = { user: userRole ? { id: "u", role: userRole } : null } as unknown as Request;
  const res = {} as Response;
  requireRole(...(allowed as any))(req, res, next);
}

describe("requireRole (admin-only guard for parent/teacher routes)", () => {
  it("blocks an unauthenticated request with 403", () => {
    const next = vi.fn();
    run(["ADMIN"], null, next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN" }));
  });

  it("blocks STUDENT, PARENT and TEACHER from ADMIN-only routes", () => {
    for (const role of ["STUDENT", "PARENT", "TEACHER"]) {
      const next = vi.fn();
      run(["ADMIN"], role, next);
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN" }));
    }
  });

  it("allows ADMIN through an ADMIN-only route", () => {
    const next = vi.fn();
    run(["ADMIN"], "ADMIN", next);
    expect(next).toHaveBeenCalledWith();
  });

  it("allows every role listed in the guard", () => {
    for (const role of ["ADMIN", "TEACHER"]) {
      const next = vi.fn();
      run(["ADMIN", "TEACHER"], role, next);
      expect(next).toHaveBeenCalledWith();
    }
  });
});

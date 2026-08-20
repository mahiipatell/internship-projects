import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { errorHandler } from "./errorHandler.js";
import { AppError } from "../lib/errors.js";

function mockRes() {
  const res: any = { statusCode: 0, body: undefined };
  res.status = (c: number) => {
    res.statusCode = c;
    return res;
  };
  res.json = (b: any) => {
    res.body = b;
    return res;
  };
  return res;
}

const known = (code: string, meta?: unknown) =>
  new Prisma.PrismaClientKnownRequestError("e", { code, clientVersion: "1", meta: meta as any });

describe("errorHandler", () => {
  it("maps P2003 (foreign key) to 400 BAD_REQUEST", () => {
    const res = mockRes();
    errorHandler(known("P2003"), {} as any, res as any, () => {});
    expect(res.statusCode).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
  });

  it("maps P2002 (unique) to 409 CONFLICT", () => {
    const res = mockRes();
    errorHandler(known("P2002", { target: ["email"] }), {} as any, res as any, () => {});
    expect(res.statusCode).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("maps P2025 (not found) to 404 NOT_FOUND", () => {
    const res = mockRes();
    errorHandler(known("P2025"), {} as any, res as any, () => {});
    expect(res.statusCode).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("maps an AppError to its status/code", () => {
    const res = mockRes();
    errorHandler(new AppError(403, "FORBIDDEN", "nope"), {} as any, res as any, () => {});
    expect(res.statusCode).toBe(403);
    expect(res.body.error.code).toBe("FORBIDDEN");
  });
});

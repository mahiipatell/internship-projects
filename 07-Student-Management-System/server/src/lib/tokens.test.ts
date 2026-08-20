import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  verifyAccessToken,
  generateRefreshToken,
  hashToken,
} from "./tokens.js";
import { hashPassword, comparePassword } from "./password.js";

describe("tokens", () => {
  it("round-trips an access token", () => {
    const token = signAccessToken({ sub: "u1", role: "ADMIN", email: "a@b.c" });
    const decoded = verifyAccessToken(token);
    expect(decoded.sub).toBe("u1");
    expect(decoded.role).toBe("ADMIN");
    expect(decoded.email).toBe("a@b.c");
  });

  it("produces a deterministic sha256 hash", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });

  it("generates a 64-char hex refresh token", () => {
    const t = generateRefreshToken();
    expect(t).toMatch(/^[0-9a-f]{64}$/);
    expect(t).not.toBe(generateRefreshToken());
  });
});

describe("password", () => {
  it("hashes and verifies", async () => {
    const hash = await hashPassword("password123");
    expect(hash).not.toBe("password123");
    expect(await comparePassword("password123", hash)).toBe(true);
    expect(await comparePassword("wrong", hash)).toBe(false);
  });
});

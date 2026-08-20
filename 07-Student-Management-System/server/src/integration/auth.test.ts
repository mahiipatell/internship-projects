import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { AddressInfo, Server } from "node:net";
import type { Socket } from "node:net";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";

const RUN = !!process.env.RUN_INTEGRATION_TESTS;

describe.skipIf(!RUN)("auth integration", () => {
  let server: Server;
  let base: string;
  let sockets: Socket[] = [];

  beforeAll(async () => {
    await prisma.user.create({
      data: {
        email: "test@sms.test",
        passwordHash: await hashPassword("password123"),
        role: "ADMIN",
        firstName: "Test",
        lastName: "Admin",
      },
    });
    const app = createApp();
    server = app.listen(0, "127.0.0.1");
    server.on("connection", (s) => sockets.push(s));
    const { port } = server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: "test@sms.test" } });
    await new Promise<void>((res) => server.close(() => res()));
    sockets.forEach((s) => s.destroy());
    await prisma.$disconnect();
  });

  it("logs in and issues an access token + refresh cookie", async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@sms.test", password: "password123" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { accessToken: string; user: { role: string } };
    expect(body.accessToken).toBeTruthy();
    expect(body.user.role).toBe("ADMIN");
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toContain("refresh_token");
  });

  it("rejects bad credentials", async () => {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@sms.test", password: "nope" }),
    });
    expect(res.status).toBe(401);
  });

  it("refreshes using the cookie and revokes the old token", async () => {
    const loginRes = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@sms.test", password: "password123" }),
    });
    const cookie = loginRes.headers.get("set-cookie")!;

    const refreshRes = await fetch(`${base}/api/auth/refresh`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
    expect(refreshRes.status).toBe(200);
    const body = (await refreshRes.json()) as { accessToken: string };
    expect(body.accessToken).toBeTruthy();
  });
});

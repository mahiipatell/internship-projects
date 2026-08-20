import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { AddressInfo, Server } from "node:net";
import type { Socket } from "node:net";
import { createApp } from "../app.js";
import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../lib/password.js";

const RUN = !!process.env.RUN_INTEGRATION_TESTS;
const PW = "password123";

describe.skipIf(!RUN)("admin RBAC integration", () => {
  let server: Server;
  let base: string;
  let sockets: Socket[] = [];

  async function login(email: string) {
    const res = await fetch(`${base}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: PW }),
    });
    const body = (await res.json()) as { accessToken: string };
    return body.accessToken;
  }

  async function call(method: string, path: string, token: string) {
    const res = await fetch(`${base}/api${path}`, {
      method,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return res.status;
  }

  beforeAll(async () => {
    // Ensure the seeded demo roles exist for RBAC checks.
    const ensure = async (email: string, role: any) => {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        await prisma.user.create({
          data: { email, passwordHash: await hashPassword(PW), role, firstName: "RBAC", lastName: "User" },
        });
      }
    };
    await ensure("admin@sms.test", "ADMIN");
    await ensure("teacher.math@sms.test", "TEACHER");
    await ensure("parent@sms.test", "PARENT");
    await ensure("arav.patel@sms.test", "STUDENT");

    const app = createApp();
    server = app.listen(0, "127.0.0.1");
    server.on("connection", (s) => sockets.push(s));
    const { port } = server.address() as AddressInfo;
    base = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    sockets.forEach((s) => s.destroy());
    await prisma.$disconnect();
  });

  it("blocks STUDENT, PARENT and TEACHER from editing/deleting parents and teachers", async () => {
    const admin = await login("admin@sms.test");
    const teacher = await login("teacher.math@sms.test");
    const parent = await login("parent@sms.test");
    const student = await login("arav.patel@sms.test");

    const parentId = (await (await fetch(`${base}/api/parents`, { headers: { Authorization: `Bearer ${admin}` } })).json())[0].id;
    const teacherId = (await (await fetch(`${base}/api/teachers`, { headers: { Authorization: `Bearer ${admin}` } })).json())[0].id;

    const nonAdmins = { teacher, parent, student };
    for (const token of Object.values(nonAdmins)) {
      expect(await call("PATCH", `/parents/${parentId}`, token)).toBe(403);
      expect(await call("DELETE", `/parents/${parentId}`, token)).toBe(403);
      expect(await call("PATCH", `/teachers/${teacherId}`, token)).toBe(403);
      expect(await call("DELETE", `/teachers/${teacherId}`, token)).toBe(403);
    }
  });

  it("lets an admin read parent and teacher detail", async () => {
    const admin = await login("admin@sms.test");
    const parentId = (await (await fetch(`${base}/api/parents`, { headers: { Authorization: `Bearer ${admin}` } })).json())[0].id;
    const teacherId = (await (await fetch(`${base}/api/teachers`, { headers: { Authorization: `Bearer ${admin}` } })).json())[0].id;
    expect(await call("GET", `/parents/${parentId}`, admin)).toBe(200);
    expect(await call("GET", `/teachers/${teacherId}`, admin)).toBe(200);
  });
});

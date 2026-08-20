import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export type AccessTokenPayload = { sub: string; role: string; email: string };

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.accessTokenTtl as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.jwtSecret) as AccessTokenPayload;
}

// Opaque refresh token: we issue a random value and only store its hash.
export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiry(): Date {
  return new Date(Date.now() + config.refreshTokenTtlDays * 24 * 60 * 60 * 1000);
}

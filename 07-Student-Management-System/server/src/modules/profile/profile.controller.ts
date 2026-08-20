import type { Request, Response } from "express";
import { changePassword, getProfile, updateProfile } from "./profile.service.js";
import { changePasswordSchema, updateProfileSchema } from "./profile.schema.js";

export async function getProfileHandler(_req: Request, res: Response) {
  res.json(await getProfile(_req.user!));
}

export async function updateProfileHandler(req: Request, res: Response) {
  const input = updateProfileSchema.parse(req.body);
  res.json(await updateProfile(req.user!, input));
}

export async function changePasswordHandler(req: Request, res: Response) {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  await changePassword(req.user!, currentPassword, newPassword);
  res.json({ message: "Password changed" });
}

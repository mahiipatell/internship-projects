import { z } from "zod";

export const parentQuerySchema = z.object({
  search: z.string().optional(),
});

export const createParentSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const updateParentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  active: z.boolean().optional(),
});

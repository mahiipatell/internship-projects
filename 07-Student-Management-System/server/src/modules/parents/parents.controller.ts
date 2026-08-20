import type { Request, Response } from "express";
import {
  createParent,
  deleteParent,
  getParent,
  listParents,
  updateParent,
} from "./parents.service.js";
import { createParentSchema, parentQuerySchema, updateParentSchema } from "./parents.schema.js";

export async function listParentsHandler(req: Request, res: Response) {
  const { search } = parentQuerySchema.parse(req.query);
  res.json(await listParents(search));
}

export async function getParentHandler(req: Request, res: Response) {
  res.json(await getParent(req.params.id));
}

export async function createParentHandler(req: Request, res: Response) {
  const input = createParentSchema.parse(req.body);
  res.status(201).json(await createParent(input));
}

export async function updateParentHandler(req: Request, res: Response) {
  const input = updateParentSchema.parse(req.body);
  res.json(await updateParent(req.params.id, input));
}

export async function deleteParentHandler(req: Request, res: Response) {
  res.json(await deleteParent(req.params.id));
}

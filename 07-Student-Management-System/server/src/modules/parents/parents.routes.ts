import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import {
  createParentHandler,
  deleteParentHandler,
  getParentHandler,
  listParentsHandler,
  updateParentHandler,
} from "./parents.controller.js";

export const parentsRouter = Router();
parentsRouter.use(authenticate);
parentsRouter.get("/", requireRole("ADMIN"), asyncHandler(listParentsHandler));
parentsRouter.post("/", requireRole("ADMIN"), asyncHandler(createParentHandler));
parentsRouter.get("/:id", requireRole("ADMIN"), asyncHandler(getParentHandler));
parentsRouter.patch("/:id", requireRole("ADMIN"), asyncHandler(updateParentHandler));
parentsRouter.delete("/:id", requireRole("ADMIN"), asyncHandler(deleteParentHandler));

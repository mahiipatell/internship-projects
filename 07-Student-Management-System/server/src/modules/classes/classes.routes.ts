import { Router } from "express";
import { asyncHandler } from "../../lib/errors.js";
import { authenticate } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import {
  addClassSubjectHandler,
  createClassHandler,
  createSectionHandler,
  createSubjectHandler,
  listClassesHandler,
  listClassSubjectsHandler,
  listSectionsHandler,
  listSubjectsHandler,
  removeClassSubjectHandler,
} from "./classes.controller.js";

export const classesRouter = Router();
classesRouter.use(authenticate);
classesRouter.get("/", asyncHandler(listClassesHandler));
classesRouter.post("/", requireRole("ADMIN"), asyncHandler(createClassHandler));
classesRouter.get("/:id/subjects", asyncHandler(listClassSubjectsHandler));
classesRouter.post("/:id/subjects", requireRole("ADMIN"), asyncHandler(addClassSubjectHandler));
classesRouter.delete("/:id/subjects/:subjectId", requireRole("ADMIN"), asyncHandler(removeClassSubjectHandler));

export const sectionsRouter = Router();
sectionsRouter.use(authenticate);
sectionsRouter.get("/", asyncHandler(listSectionsHandler));
sectionsRouter.post("/", requireRole("ADMIN"), asyncHandler(createSectionHandler));

export const subjectsRouter = Router();
subjectsRouter.use(authenticate);
subjectsRouter.get("/", asyncHandler(listSubjectsHandler));
subjectsRouter.post("/", requireRole("ADMIN"), asyncHandler(createSubjectHandler));

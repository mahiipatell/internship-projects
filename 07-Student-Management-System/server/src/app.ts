import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { classesRouter, sectionsRouter, subjectsRouter } from "./modules/classes/classes.routes.js";
import { studentsRouter } from "./modules/students/students.routes.js";
import { teachersRouter } from "./modules/teachers/teachers.routes.js";
import { parentsRouter } from "./modules/parents/parents.routes.js";
import { attendanceRouter } from "./modules/attendance/attendance.routes.js";
import { examsRouter } from "./modules/exams/exams.routes.js";
import { assignmentsRouter } from "./modules/assignments/assignments.routes.js";
import { timetableRouter } from "./modules/timetable/timetable.routes.js";
import { announcementsRouter } from "./modules/announcements/announcements.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { profileRouter } from "./modules/profile/profile.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/classes", classesRouter);
  app.use("/api/sections", sectionsRouter);
  app.use("/api/subjects", subjectsRouter);
  app.use("/api/students", studentsRouter);
  app.use("/api/teachers", teachersRouter);
  app.use("/api/parents", parentsRouter);
  app.use("/api/attendance", attendanceRouter);
  app.use("/api/exams", examsRouter);
  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/timetable", timetableRouter);
  app.use("/api/announcements", announcementsRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/profile", profileRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

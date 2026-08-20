/*
  Warnings:
  - Added the required column `rollNumber` to the `Student` table without a default value.

  The existing rows are backfilled with a per-row unique placeholder (the primary key)
  to satisfy the NOT NULL + composite unique constraint, then the seed step replaces them
  with real, section-scoped roll numbers. The placeholder uses the row's own id so the
  unique index can never collide.
*/

-- AlterTable: add nullable first so existing rows are not rejected.
ALTER TABLE "Student" ADD COLUMN "rollNumber" TEXT;

-- Backfill existing rows.
UPDATE "Student" SET "rollNumber" = "id" WHERE "rollNumber" IS NULL;

-- AlterTable: now enforce NOT NULL.
ALTER TABLE "Student" ALTER COLUMN "rollNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Student_rollNumber_sectionId_key" ON "Student"("rollNumber", "sectionId");

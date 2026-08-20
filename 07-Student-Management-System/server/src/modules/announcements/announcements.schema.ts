import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  scope: z.enum(["INSTITUTION", "SECTION"]),
  sectionId: z.string().optional(),
});

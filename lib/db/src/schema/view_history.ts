import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { profilesTable } from "./profiles";

export const viewHistoryTable = pgTable("view_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profilesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

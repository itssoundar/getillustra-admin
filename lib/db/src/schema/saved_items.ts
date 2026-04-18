import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { profilesTable } from "./profiles";

export const savedItemsTable = pgTable("saved_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => profilesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

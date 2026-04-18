import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { tagsTable } from "./tags";

export const projectTagsTable = pgTable("project_tags", {
  projectId: uuid("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  tagId: uuid("tag_id").notNull().references(() => tagsTable.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.projectId, t.tagId] })]);

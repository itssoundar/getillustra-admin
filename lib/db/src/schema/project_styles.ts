import { pgTable, uuid, primaryKey } from "drizzle-orm/pg-core";
import { projectsTable } from "./projects";
import { stylesTable } from "./styles";

export const projectStylesTable = pgTable("project_styles", {
  projectId: uuid("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  styleId: uuid("style_id").notNull().references(() => stylesTable.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.projectId, t.styleId] })]);

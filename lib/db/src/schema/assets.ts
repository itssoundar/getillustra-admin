import { pgTable, text, uuid, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { projectsTable } from "./projects";

export const assetsTable = pgTable("assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  url: text("url").notNull(),
  projectId: uuid("project_id").notNull().references(() => projectsTable.id, { onDelete: "cascade" }),
  isPremium: boolean("is_premium").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAssetSchema = createInsertSchema(assetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Asset = typeof assetsTable.$inferSelect;

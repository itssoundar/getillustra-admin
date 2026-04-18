import { pgTable, uuid, timestamp } from "drizzle-orm/pg-core";
import { assetsTable } from "./assets";
import { profilesTable } from "./profiles";

export const downloadsTable = pgTable("downloads", {
  id: uuid("id").primaryKey().defaultRandom(),
  assetId: uuid("asset_id").notNull().references(() => assetsTable.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => profilesTable.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

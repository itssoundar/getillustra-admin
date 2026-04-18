import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody, GetSettingsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateSettings() {
  const existing = await db.select().from(settingsTable).limit(1);
  if (existing.length > 0) return existing[0];

  const [created] = await db.insert(settingsTable).values({}).returning();
  return created;
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getOrCreateSettings();
  res.json(
    GetSettingsResponse.parse({
      siteName: settings.siteName,
      logoUrl: settings.logoUrl ?? null,
      contactEmail: settings.contactEmail ?? null,
      featuredItemsCount: settings.featuredItemsCount,
      seoTitle: settings.seoTitle ?? null,
      seoDescription: settings.seoDescription ?? null,
    }),
  );
});

router.put("/settings", async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const existing = await getOrCreateSettings();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.siteName !== undefined) updateData.siteName = parsed.data.siteName;
  if (parsed.data.logoUrl !== undefined) updateData.logoUrl = parsed.data.logoUrl;
  if (parsed.data.contactEmail !== undefined) updateData.contactEmail = parsed.data.contactEmail;
  if (parsed.data.featuredItemsCount !== undefined) updateData.featuredItemsCount = parsed.data.featuredItemsCount;
  if (parsed.data.seoTitle !== undefined) updateData.seoTitle = parsed.data.seoTitle;
  if (parsed.data.seoDescription !== undefined) updateData.seoDescription = parsed.data.seoDescription;

  const { eq } = await import("drizzle-orm");
  const [settings] = await db
    .update(settingsTable)
    .set(updateData)
    .where(eq(settingsTable.id, existing.id))
    .returning();

  res.json(
    GetSettingsResponse.parse({
      siteName: settings.siteName,
      logoUrl: settings.logoUrl ?? null,
      contactEmail: settings.contactEmail ?? null,
      featuredItemsCount: settings.featuredItemsCount,
      seoTitle: settings.seoTitle ?? null,
      seoDescription: settings.seoDescription ?? null,
    }),
  );
});

export default router;

import { Router, type IRouter } from "express";
import { db, assetsTable, projectsTable } from "@workspace/db";
import { eq, ilike, inArray, and, desc } from "drizzle-orm";
import {
  CreateAssetBody,
  UpdateAssetBody,
  UpdateAssetParams,
  DeleteAssetParams,
  BulkUpdateAssetsBody,
  ListAssetsQueryParams,
  ListAssetsResponse,
  UpdateAssetResponse,
  BulkUpdateAssetsResponse,
} from "@workspace/api-zod";
import { count } from "drizzle-orm";

const router: IRouter = Router();

router.get("/assets", async (req, res): Promise<void> => {
  const parsed = ListAssetsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { project_id, is_premium, search, limit = 50, offset = 0 } = parsed.data;

  const conditions = [];
  if (project_id) conditions.push(eq(assetsTable.projectId, project_id));
  if (is_premium !== undefined) conditions.push(eq(assetsTable.isPremium, is_premium));
  if (search) conditions.push(ilike(assetsTable.name, `%${search}%`));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: assetsTable.id,
        name: assetsTable.name,
        url: assetsTable.url,
        projectId: assetsTable.projectId,
        projectTitle: projectsTable.title,
        isPremium: assetsTable.isPremium,
        sortOrder: assetsTable.sortOrder,
        fileType: assetsTable.fileType,
        fileSize: assetsTable.fileSize,
        createdAt: assetsTable.createdAt,
      })
      .from(assetsTable)
      .leftJoin(projectsTable, eq(projectsTable.id, assetsTable.projectId))
      .where(whereClause)
      .orderBy(desc(assetsTable.createdAt))
      .limit(Number(limit))
      .offset(Number(offset)),
    db.select({ count: count() }).from(assetsTable).where(whereClause),
  ]);

  res.json(
    ListAssetsResponse.parse({
      assets: rows.map((r) => ({
        ...r,
        projectTitle: r.projectTitle ?? null,
        fileType: r.fileType ?? null,
        fileSize: r.fileSize ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total: Number(totalRow.count),
    }),
  );
});

router.post("/assets", async (req, res): Promise<void> => {
  const parsed = CreateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [asset] = await db
    .insert(assetsTable)
    .values({
      name: parsed.data.name,
      url: parsed.data.url,
      projectId: parsed.data.projectId,
      isPremium: parsed.data.isPremium,
      sortOrder: parsed.data.sortOrder,
      fileType: parsed.data.fileType ?? null,
      fileSize: parsed.data.fileSize ?? null,
    })
    .returning();

  const [project] = await db
    .select({ title: projectsTable.title })
    .from(projectsTable)
    .where(eq(projectsTable.id, asset.projectId));

  res.status(201).json({
    ...asset,
    projectTitle: project?.title ?? null,
    fileType: asset.fileType ?? null,
    fileSize: asset.fileSize ?? null,
    createdAt: asset.createdAt.toISOString(),
  });
});

router.put("/assets/:id", async (req, res): Promise<void> => {
  const params = UpdateAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAssetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.isPremium !== undefined) updateData.isPremium = parsed.data.isPremium;
  if (parsed.data.sortOrder !== undefined) updateData.sortOrder = parsed.data.sortOrder;
  if (parsed.data.projectId !== undefined) updateData.projectId = parsed.data.projectId;

  const [asset] = await db
    .update(assetsTable)
    .set(updateData)
    .where(eq(assetsTable.id, params.data.id))
    .returning();

  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  const [project] = await db
    .select({ title: projectsTable.title })
    .from(projectsTable)
    .where(eq(projectsTable.id, asset.projectId));

  res.json(
    UpdateAssetResponse.parse({
      ...asset,
      projectTitle: project?.title ?? null,
      fileType: asset.fileType ?? null,
      fileSize: asset.fileSize ?? null,
      createdAt: asset.createdAt.toISOString(),
    }),
  );
});

router.delete("/assets/:id", async (req, res): Promise<void> => {
  const params = DeleteAssetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [asset] = await db
    .delete(assetsTable)
    .where(eq(assetsTable.id, params.data.id))
    .returning();

  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/assets/bulk", async (req, res): Promise<void> => {
  const parsed = BulkUpdateAssetsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { ids, action, projectId } = parsed.data;

  if (ids.length === 0) {
    res.json(BulkUpdateAssetsResponse.parse({ updated: 0 }));
    return;
  }

  let updated = 0;

  if (action === "delete") {
    const deleted = await db
      .delete(assetsTable)
      .where(inArray(assetsTable.id, ids))
      .returning();
    updated = deleted.length;
  } else if (action === "mark_premium") {
    const result = await db
      .update(assetsTable)
      .set({ isPremium: true })
      .where(inArray(assetsTable.id, ids))
      .returning();
    updated = result.length;
  } else if (action === "unmark_premium") {
    const result = await db
      .update(assetsTable)
      .set({ isPremium: false })
      .where(inArray(assetsTable.id, ids))
      .returning();
    updated = result.length;
  } else if (action === "move_project" && projectId) {
    const result = await db
      .update(assetsTable)
      .set({ projectId })
      .where(inArray(assetsTable.id, ids))
      .returning();
    updated = result.length;
  }

  res.json(BulkUpdateAssetsResponse.parse({ updated }));
});

export default router;

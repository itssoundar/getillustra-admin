import { Router, type IRouter } from "express";
import { db, tagsTable, projectTagsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreateTagBody,
  UpdateTagBody,
  UpdateTagParams,
  DeleteTagParams,
  ListTagsResponse,
  UpdateTagResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/tags", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: tagsTable.id,
      name: tagsTable.name,
      slug: tagsTable.slug,
      createdAt: tagsTable.createdAt,
      projectCount: count(projectTagsTable.projectId),
    })
    .from(tagsTable)
    .leftJoin(projectTagsTable, eq(projectTagsTable.tagId, tagsTable.id))
    .groupBy(tagsTable.id);

  res.json(
    ListTagsResponse.parse(
      rows.map((r) => ({ ...r, projectCount: Number(r.projectCount), createdAt: r.createdAt.toISOString() })),
    ),
  );
});

router.post("/tags", async (req, res): Promise<void> => {
  const parsed = CreateTagBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tag] = await db.insert(tagsTable).values(parsed.data).returning();
  res.status(201).json({ ...tag, projectCount: 0, createdAt: tag.createdAt.toISOString() });
});

router.put("/tags/:id", async (req, res): Promise<void> => {
  const params = UpdateTagParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTagBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tag] = await db
    .update(tagsTable)
    .set(parsed.data)
    .where(eq(tagsTable.id, params.data.id))
    .returning();

  if (!tag) {
    res.status(404).json({ error: "Tag not found" });
    return;
  }

  const [{ projectCount }] = await db
    .select({ projectCount: count(projectTagsTable.projectId) })
    .from(projectTagsTable)
    .where(eq(projectTagsTable.tagId, tag.id));

  res.json(UpdateTagResponse.parse({ ...tag, projectCount: Number(projectCount), createdAt: tag.createdAt.toISOString() }));
});

router.delete("/tags/:id", async (req, res): Promise<void> => {
  const params = DeleteTagParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [tag] = await db
    .delete(tagsTable)
    .where(eq(tagsTable.id, params.data.id))
    .returning();

  if (!tag) {
    res.status(404).json({ error: "Tag not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

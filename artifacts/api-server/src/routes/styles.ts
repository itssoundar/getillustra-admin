import { Router, type IRouter } from "express";
import { db, stylesTable, projectStylesTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreateStyleBody,
  UpdateStyleBody,
  UpdateStyleParams,
  DeleteStyleParams,
  ListStylesResponse,
  UpdateStyleResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/styles", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: stylesTable.id,
      name: stylesTable.name,
      slug: stylesTable.slug,
      createdAt: stylesTable.createdAt,
      projectCount: count(projectStylesTable.projectId),
    })
    .from(stylesTable)
    .leftJoin(projectStylesTable, eq(projectStylesTable.styleId, stylesTable.id))
    .groupBy(stylesTable.id);

  res.json(
    ListStylesResponse.parse(
      rows.map((r) => ({ ...r, projectCount: Number(r.projectCount), createdAt: r.createdAt.toISOString() })),
    ),
  );
});

router.post("/styles", async (req, res): Promise<void> => {
  const parsed = CreateStyleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [style] = await db.insert(stylesTable).values(parsed.data).returning();
  res.status(201).json({ ...style, projectCount: 0, createdAt: style.createdAt.toISOString() });
});

router.put("/styles/:id", async (req, res): Promise<void> => {
  const params = UpdateStyleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStyleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [style] = await db
    .update(stylesTable)
    .set(parsed.data)
    .where(eq(stylesTable.id, params.data.id))
    .returning();

  if (!style) {
    res.status(404).json({ error: "Style not found" });
    return;
  }

  const [{ projectCount }] = await db
    .select({ projectCount: count(projectStylesTable.projectId) })
    .from(projectStylesTable)
    .where(eq(projectStylesTable.styleId, style.id));

  res.json(UpdateStyleResponse.parse({ ...style, projectCount: Number(projectCount), createdAt: style.createdAt.toISOString() }));
});

router.delete("/styles/:id", async (req, res): Promise<void> => {
  const params = DeleteStyleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [style] = await db
    .delete(stylesTable)
    .where(eq(stylesTable.id, params.data.id))
    .returning();

  if (!style) {
    res.status(404).json({ error: "Style not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

import { Router, type IRouter } from "express";
import { db, categoriesTable, projectsTable } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
  ListCategoriesResponse,
  UpdateCategoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      slug: categoriesTable.slug,
      description: categoriesTable.description,
      createdAt: categoriesTable.createdAt,
      projectCount: count(projectsTable.id),
    })
    .from(categoriesTable)
    .leftJoin(projectsTable, eq(projectsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id);

  res.json(
    ListCategoriesResponse.parse(
      rows.map((r) => ({ ...r, projectCount: Number(r.projectCount), createdAt: r.createdAt.toISOString() })),
    ),
  );
});

router.post("/categories", async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [cat] = await db
    .insert(categoriesTable)
    .values({ name: parsed.data.name, slug: parsed.data.slug, description: parsed.data.description ?? null })
    .returning();

  res.status(201).json({ ...cat, projectCount: 0, createdAt: cat.createdAt.toISOString() });
});

router.put("/categories/:id", async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
  if (parsed.data.slug !== undefined) updateData.slug = parsed.data.slug;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;

  const [cat] = await db
    .update(categoriesTable)
    .set(updateData)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  const [{ projectCount }] = await db
    .select({ projectCount: count(projectsTable.id) })
    .from(projectsTable)
    .where(eq(projectsTable.categoryId, cat.id));

  res.json(UpdateCategoryResponse.parse({ ...cat, projectCount: Number(projectCount), createdAt: cat.createdAt.toISOString() }));
});

router.delete("/categories/:id", async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [cat] = await db
    .delete(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!cat) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;

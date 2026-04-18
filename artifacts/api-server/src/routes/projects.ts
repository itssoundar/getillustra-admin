import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  categoriesTable,
  projectStylesTable,
  projectTagsTable,
  assetsTable,
} from "@workspace/db";
import { eq, ilike, and, count, inArray, desc } from "drizzle-orm";
import {
  CreateProjectBody,
  UpdateProjectBody,
  GetProjectParams,
  UpdateProjectParams,
  DeleteProjectParams,
  PublishProjectParams,
  UnpublishProjectParams,
  ToggleProjectFeaturedParams,
  ListProjectsQueryParams,
  ListProjectsResponse,
  GetProjectResponse,
  UpdateProjectResponse,
  PublishProjectResponse,
  UnpublishProjectResponse,
  ToggleProjectFeaturedResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function buildProjectResponse(projectId: string) {
  const [project] = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      slug: projectsTable.slug,
      description: projectsTable.description,
      coverImage: projectsTable.coverImage,
      status: projectsTable.status,
      featured: projectsTable.featured,
      categoryId: projectsTable.categoryId,
      categoryName: categoriesTable.name,
      viewCount: projectsTable.viewCount,
      downloadCount: projectsTable.downloadCount,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
    })
    .from(projectsTable)
    .leftJoin(categoriesTable, eq(categoriesTable.id, projectsTable.categoryId))
    .where(eq(projectsTable.id, projectId));

  if (!project) return null;

  const [styleRows, tagRows, [assetCountRow]] = await Promise.all([
    db
      .select({ styleId: projectStylesTable.styleId })
      .from(projectStylesTable)
      .where(eq(projectStylesTable.projectId, projectId)),
    db
      .select({ tagId: projectTagsTable.tagId })
      .from(projectTagsTable)
      .where(eq(projectTagsTable.projectId, projectId)),
    db
      .select({ count: count() })
      .from(assetsTable)
      .where(eq(assetsTable.projectId, projectId)),
  ]);

  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    description: project.description ?? null,
    coverImage: project.coverImage ?? null,
    status: project.status,
    featured: project.featured,
    categoryId: project.categoryId ?? null,
    categoryName: project.categoryName ?? null,
    styleIds: styleRows.map((r) => r.styleId),
    tagIds: tagRows.map((r) => r.tagId),
    viewCount: project.viewCount,
    downloadCount: project.downloadCount,
    assetCount: Number(assetCountRow.count),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}

router.get("/projects", async (req, res): Promise<void> => {
  const parsed = ListProjectsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, status, category_id, featured, limit = 50, offset = 0 } = parsed.data;

  const conditions = [];
  if (search) conditions.push(ilike(projectsTable.title, `%${search}%`));
  if (status) conditions.push(eq(projectsTable.status, status));
  if (category_id) conditions.push(eq(projectsTable.categoryId, category_id));
  if (featured !== undefined) conditions.push(eq(projectsTable.featured, featured));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select({
        id: projectsTable.id,
        title: projectsTable.title,
        slug: projectsTable.slug,
        description: projectsTable.description,
        coverImage: projectsTable.coverImage,
        status: projectsTable.status,
        featured: projectsTable.featured,
        categoryId: projectsTable.categoryId,
        categoryName: categoriesTable.name,
        viewCount: projectsTable.viewCount,
        downloadCount: projectsTable.downloadCount,
        createdAt: projectsTable.createdAt,
        updatedAt: projectsTable.updatedAt,
      })
      .from(projectsTable)
      .leftJoin(categoriesTable, eq(categoriesTable.id, projectsTable.categoryId))
      .where(whereClause)
      .orderBy(desc(projectsTable.createdAt))
      .limit(Number(limit))
      .offset(Number(offset)),
    db.select({ count: count() }).from(projectsTable).where(whereClause),
  ]);

  const projectIds = rows.map((r) => r.id);

  let styleMap: Record<string, string[]> = {};
  let tagMap: Record<string, string[]> = {};
  let assetCountMap: Record<string, number> = {};

  if (projectIds.length > 0) {
    const [styleRows, tagRows, assetCounts] = await Promise.all([
      db
        .select()
        .from(projectStylesTable)
        .where(inArray(projectStylesTable.projectId, projectIds)),
      db
        .select()
        .from(projectTagsTable)
        .where(inArray(projectTagsTable.projectId, projectIds)),
      db
        .select({ projectId: assetsTable.projectId, count: count() })
        .from(assetsTable)
        .where(inArray(assetsTable.projectId, projectIds))
        .groupBy(assetsTable.projectId),
    ]);

    for (const r of styleRows) {
      if (!styleMap[r.projectId]) styleMap[r.projectId] = [];
      styleMap[r.projectId].push(r.styleId);
    }
    for (const r of tagRows) {
      if (!tagMap[r.projectId]) tagMap[r.projectId] = [];
      tagMap[r.projectId].push(r.tagId);
    }
    for (const r of assetCounts) {
      assetCountMap[r.projectId] = Number(r.count);
    }
  }

  const projects = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description ?? null,
    coverImage: r.coverImage ?? null,
    status: r.status,
    featured: r.featured,
    categoryId: r.categoryId ?? null,
    categoryName: r.categoryName ?? null,
    styleIds: styleMap[r.id] ?? [],
    tagIds: tagMap[r.id] ?? [],
    viewCount: r.viewCount,
    downloadCount: r.downloadCount,
    assetCount: assetCountMap[r.id] ?? 0,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  res.json(ListProjectsResponse.parse({ projects, total: Number(totalRow.count) }));
});

router.post("/projects", async (req, res): Promise<void> => {
  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { styleIds, tagIds, ...rest } = parsed.data;

  const [project] = await db
    .insert(projectsTable)
    .values({
      title: rest.title,
      slug: rest.slug,
      description: rest.description ?? null,
      coverImage: rest.coverImage ?? null,
      status: rest.status,
      featured: rest.featured,
      categoryId: rest.categoryId ?? null,
    })
    .returning();

  if (styleIds.length > 0) {
    await db.insert(projectStylesTable).values(
      styleIds.map((sid) => ({ projectId: project.id, styleId: sid })),
    );
  }
  if (tagIds.length > 0) {
    await db.insert(projectTagsTable).values(
      tagIds.map((tid) => ({ projectId: project.id, tagId: tid })),
    );
  }

  const result = await buildProjectResponse(project.id);
  res.status(201).json(GetProjectResponse.parse(result));
});

router.get("/projects/:id", async (req, res): Promise<void> => {
  const params = GetProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const result = await buildProjectResponse(params.data.id);
  if (!result) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json(GetProjectResponse.parse(result));
});

router.put("/projects/:id", async (req, res): Promise<void> => {
  const params = UpdateProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { styleIds, tagIds, ...rest } = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (rest.title !== undefined) updateData.title = rest.title;
  if (rest.slug !== undefined) updateData.slug = rest.slug;
  if (rest.description !== undefined) updateData.description = rest.description;
  if (rest.coverImage !== undefined) updateData.coverImage = rest.coverImage;
  if (rest.status !== undefined) updateData.status = rest.status;
  if (rest.featured !== undefined) updateData.featured = rest.featured;
  if (rest.categoryId !== undefined) updateData.categoryId = rest.categoryId;

  const [project] = await db
    .update(projectsTable)
    .set(updateData)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  if (styleIds !== undefined) {
    await db.delete(projectStylesTable).where(eq(projectStylesTable.projectId, project.id));
    if (styleIds.length > 0) {
      await db.insert(projectStylesTable).values(
        styleIds.map((sid) => ({ projectId: project.id, styleId: sid })),
      );
    }
  }

  if (tagIds !== undefined) {
    await db.delete(projectTagsTable).where(eq(projectTagsTable.projectId, project.id));
    if (tagIds.length > 0) {
      await db.insert(projectTagsTable).values(
        tagIds.map((tid) => ({ projectId: project.id, tagId: tid })),
      );
    }
  }

  const result = await buildProjectResponse(project.id);
  res.json(UpdateProjectResponse.parse(result));
});

router.delete("/projects/:id", async (req, res): Promise<void> => {
  const params = DeleteProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .delete(projectsTable)
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/projects/:id/publish", async (req, res): Promise<void> => {
  const params = PublishProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set({ status: "published" })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const result = await buildProjectResponse(project.id);
  res.json(PublishProjectResponse.parse(result));
});

router.post("/projects/:id/unpublish", async (req, res): Promise<void> => {
  const params = UnpublishProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set({ status: "draft" })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const result = await buildProjectResponse(project.id);
  res.json(UnpublishProjectResponse.parse(result));
});

router.post("/projects/:id/toggle-featured", async (req, res): Promise<void> => {
  const params = ToggleProjectFeaturedParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [current] = await db
    .select({ featured: projectsTable.featured })
    .from(projectsTable)
    .where(eq(projectsTable.id, params.data.id));

  if (!current) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [project] = await db
    .update(projectsTable)
    .set({ featured: !current.featured })
    .where(eq(projectsTable.id, params.data.id))
    .returning();

  const result = await buildProjectResponse(project.id);
  res.json(ToggleProjectFeaturedResponse.parse(result));
});

export default router;

import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  assetsTable,
  downloadsTable,
  profilesTable,
  savedItemsTable,
  viewHistoryTable,
} from "@workspace/db";
import { sql, count, desc, gte } from "drizzle-orm";
import {
  GetMostViewedProjectsResponse,
  GetMostDownloadedAssetsResponse,
  GetUserGrowthResponse,
  GetSavesTrendResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/most-viewed", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      coverImage: projectsTable.coverImage,
      viewCount: projectsTable.viewCount,
    })
    .from(projectsTable)
    .orderBy(desc(projectsTable.viewCount))
    .limit(10);

  res.json(
    GetMostViewedProjectsResponse.parse(
      rows.map((r) => ({ ...r, coverImage: r.coverImage ?? null })),
    ),
  );
});

router.get("/analytics/most-downloaded", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: assetsTable.id,
      name: assetsTable.name,
      projectTitle: projectsTable.title,
      downloadCount: count(downloadsTable.id),
    })
    .from(assetsTable)
    .leftJoin(downloadsTable, sql`${downloadsTable.assetId} = ${assetsTable.id}`)
    .leftJoin(projectsTable, sql`${projectsTable.id} = ${assetsTable.projectId}`)
    .groupBy(assetsTable.id, projectsTable.title)
    .orderBy(desc(count(downloadsTable.id)))
    .limit(10);

  res.json(
    GetMostDownloadedAssetsResponse.parse(
      rows.map((r) => ({ ...r, downloadCount: Number(r.downloadCount), projectTitle: r.projectTitle ?? null })),
    ),
  );
});

router.get("/analytics/user-growth", async (_req, res): Promise<void> => {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const rows = await db
    .select({
      date: sql<string>`DATE(${profilesTable.createdAt})::text`,
      value: count(),
    })
    .from(profilesTable)
    .where(gte(profilesTable.createdAt, ninetyDaysAgo))
    .groupBy(sql`DATE(${profilesTable.createdAt})`)
    .orderBy(sql`DATE(${profilesTable.createdAt})`);

  res.json(GetUserGrowthResponse.parse(rows.map((r) => ({ date: r.date, value: Number(r.value) }))));
});

router.get("/analytics/saves-trend", async (_req, res): Promise<void> => {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const rows = await db
    .select({
      date: sql<string>`DATE(${savedItemsTable.createdAt})::text`,
      value: count(),
    })
    .from(savedItemsTable)
    .where(gte(savedItemsTable.createdAt, ninetyDaysAgo))
    .groupBy(sql`DATE(${savedItemsTable.createdAt})`)
    .orderBy(sql`DATE(${savedItemsTable.createdAt})`);

  res.json(GetSavesTrendResponse.parse(rows.map((r) => ({ date: r.date, value: Number(r.value) }))));
});

export default router;

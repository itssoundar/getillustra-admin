import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import {
  projectsTable,
  assetsTable,
  profilesTable,
  downloadsTable,
  categoriesTable,
  savedItemsTable,
} from "@workspace/db";
import { sql, count, eq, gte, desc } from "drizzle-orm";
import {
  GetDashboardStatsResponse,
  GetRecentActivityResponse,
  GetUploadTrendResponse,
  GetTopCategoriesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [[projectCount], [assetCount], [publishedCount], [userCount]] =
    await Promise.all([
      db.select({ count: count() }).from(projectsTable),
      db.select({ count: count() }).from(assetsTable),
      db
        .select({ count: count() })
        .from(projectsTable)
        .where(eq(projectsTable.status, "published")),
      db.select({ count: count() }).from(profilesTable),
    ]);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [downloadCount] = await db
    .select({ count: count() })
    .from(downloadsTable)
    .where(gte(downloadsTable.createdAt, startOfMonth));

  const stats = {
    totalProjects: Number(projectCount.count),
    totalAssets: Number(assetCount.count),
    publishedProjects: Number(publishedCount.count),
    totalUsers: Number(userCount.count),
    downloadsThisMonth: Number(downloadCount.count),
  };

  res.json(GetDashboardStatsResponse.parse(stats));
});

router.get("/dashboard/recent-activity", async (_req, res): Promise<void> => {
  const recentProjects = await db
    .select({
      id: projectsTable.id,
      title: projectsTable.title,
      status: projectsTable.status,
      createdAt: projectsTable.createdAt,
      updatedAt: projectsTable.updatedAt,
    })
    .from(projectsTable)
    .orderBy(desc(projectsTable.updatedAt))
    .limit(5);

  const recentUsers = await db
    .select({
      id: profilesTable.id,
      email: profilesTable.email,
      fullName: profilesTable.fullName,
      createdAt: profilesTable.createdAt,
    })
    .from(profilesTable)
    .orderBy(desc(profilesTable.createdAt))
    .limit(3);

  const activities: {
    id: string;
    type: "upload" | "edit" | "new_user" | "publish" | "delete";
    description: string;
    timestamp: string;
    userId?: string;
    userName?: string;
  }[] = [];

  for (const project of recentProjects) {
    const isNew =
      project.createdAt.getTime() === project.updatedAt.getTime() ||
      Math.abs(project.createdAt.getTime() - project.updatedAt.getTime()) < 5000;
    activities.push({
      id: `proj-${project.id}`,
      type: isNew ? "upload" : project.status === "published" ? "publish" : "edit",
      description: isNew
        ? `New project "${project.title}" uploaded`
        : project.status === "published"
          ? `Project "${project.title}" published`
          : `Project "${project.title}" updated`,
      timestamp: project.updatedAt.toISOString(),
    });
  }

  for (const user of recentUsers) {
    activities.push({
      id: `user-${user.id}`,
      type: "new_user",
      description: `New user ${user.fullName || user.email} joined`,
      timestamp: user.createdAt.toISOString(),
      userId: user.id,
      userName: user.fullName || user.email,
    });
  }

  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  res.json(GetRecentActivityResponse.parse(activities.slice(0, 10)));
});

router.get("/dashboard/upload-trend", async (_req, res): Promise<void> => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const rows = await db
    .select({
      date: sql<string>`DATE(${projectsTable.createdAt})::text`,
      value: count(),
    })
    .from(projectsTable)
    .where(gte(projectsTable.createdAt, thirtyDaysAgo))
    .groupBy(sql`DATE(${projectsTable.createdAt})`)
    .orderBy(sql`DATE(${projectsTable.createdAt})`);

  res.json(GetUploadTrendResponse.parse(rows.map((r) => ({ date: r.date, value: Number(r.value) }))));
});

router.get("/dashboard/top-categories", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      count: count(projectsTable.id),
    })
    .from(categoriesTable)
    .leftJoin(projectsTable, eq(projectsTable.categoryId, categoriesTable.id))
    .groupBy(categoriesTable.id, categoriesTable.name)
    .orderBy(desc(count(projectsTable.id)))
    .limit(8);

  res.json(
    GetTopCategoriesResponse.parse(
      rows.map((r) => ({ id: r.id, name: r.name, count: Number(r.count) })),
    ),
  );
});

export default router;

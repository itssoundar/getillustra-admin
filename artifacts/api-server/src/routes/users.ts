import { Router, type IRouter } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq, ilike, or } from "drizzle-orm";
import {
  ListUsersQueryParams,
  ListUsersResponse,
  UpdateUserRoleBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users", async (req, res): Promise<void> => {
  const parsed = ListUsersQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { search, role } = parsed.data;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(profilesTable.email, `%${search}%`),
        ilike(profilesTable.fullName, `%${search}%`),
      ),
    );
  }
  if (role) {
    conditions.push(eq(profilesTable.role, role));
  }

  const rows = await db
    .select()
    .from(profilesTable)
    .where(conditions.length > 0 ? conditions[0] : undefined);

  res.json(
    ListUsersResponse.parse(
      rows.map((r) => ({
        id: r.id,
        email: r.email,
        fullName: r.fullName ?? null,
        role: r.role,
        avatarUrl: r.avatarUrl ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
    ),
  );
});

router.put("/users/:id/role", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const parsed = UpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db
    .update(profilesTable)
    .set({ role: parsed.data.role })
    .where(eq(profilesTable.id, rawId))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName ?? null,
    role: user.role,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;

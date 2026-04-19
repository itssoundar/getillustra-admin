import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

// =========================================================================
// Types
// =========================================================================
export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  projectCount: number;
  createdAt: string;
};
export type Style = {
  id: string;
  name: string;
  slug: string;
  projectCount: number;
  createdAt: string;
};
export type Tag = {
  id: string;
  name: string;
  slug: string;
  projectCount: number;
  createdAt: string;
};
export type Project = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  featured: boolean;
  categoryId: string | null;
  categoryName: string | null;
  styleIds: string[];
  tagIds: string[];
  viewCount: number;
  downloadCount: number;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
};
export type Asset = {
  id: string;
  name: string;
  url: string;
  projectId: string;
  projectTitle: string | null;
  isPremium: boolean;
  sortOrder: number;
  fileType: string | null;
  fileSize: number | null;
  createdAt: string;
};
export type User = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  avatarUrl: string | null;
  createdAt: string;
};
export type Settings = {
  siteName: string;
  logoUrl: string | null;
  contactEmail: string | null;
  featuredItemsCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
};

// =========================================================================
// Query keys
// =========================================================================
export const getListCategoriesQueryKey = () => ["categories"] as const;
export const getListStylesQueryKey = () => ["styles"] as const;
export const getListTagsQueryKey = () => ["tags"] as const;
export const getListProjectsQueryKey = (params?: unknown) =>
  (params === undefined ? ["projects"] : ["projects", params]) as readonly unknown[];
export const getGetProjectQueryKey = (id: string) =>
  ["project", id] as const;
export const getListAssetsQueryKey = (params?: unknown) =>
  (params === undefined ? ["assets"] : ["assets", params]) as readonly unknown[];
export const getListUsersQueryKey = (params?: unknown) =>
  (params === undefined ? ["users"] : ["users", params]) as readonly unknown[];
export const getGetSettingsQueryKey = () => ["settings"] as const;

// =========================================================================
// Helpers
// =========================================================================
type MutationOpts<TData, TVars> = {
  mutation?: Omit<UseMutationOptions<TData, Error, TVars>, "mutationFn">;
};
type QueryOpts<TData> = {
  query?: Partial<UseQueryOptions<TData, Error>> & { queryKey?: readonly unknown[] };
};

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// =========================================================================
// Categories
// =========================================================================
async function listCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, created_at, projects(count)")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    createdAt: r.created_at,
    projectCount: r.projects?.[0]?.count ?? 0,
  }));
}

export function useListCategories(opts?: QueryOpts<Category[]>) {
  return useQuery<Category[], Error>({
    queryKey: getListCategoriesQueryKey(),
    queryFn: listCategories,
    ...(opts?.query ?? {}),
  });
}

export function useCreateCategory(
  opts?: MutationOpts<Category, { data: { name: string; slug: string; description?: string | null } }>,
) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const { data: row, error } = await supabase
        .from("categories")
        .insert({
          name: data.name,
          slug: data.slug,
          description: data.description ?? null,
        })
        .select("id, name, slug, description, created_at")
        .single();
      if (error) throw new Error(error.message);
      return { ...(row as any), description: row!.description, createdAt: row!.created_at, projectCount: 0 } as Category;
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useUpdateCategory(
  opts?: MutationOpts<Category, { id: string; data: { name?: string; slug?: string; description?: string | null } }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: row, error } = await supabase
        .from("categories")
        .update(data)
        .eq("id", id)
        .select("id, name, slug, description, created_at")
        .single();
      if (error) throw new Error(error.message);
      return { ...(row as any), createdAt: row!.created_at, projectCount: 0 } as Category;
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useDeleteCategory(opts?: MutationOpts<{ id: string }, { id: string }>) {
  return useMutation({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    },
    ...(opts?.mutation ?? {}),
  });
}

// =========================================================================
// Styles
// =========================================================================
async function listStyles(): Promise<Style[]> {
  const { data, error } = await supabase
    .from("styles")
    .select("id, name, slug, created_at, project_styles(count)")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    createdAt: r.created_at,
    projectCount: r.project_styles?.[0]?.count ?? 0,
  }));
}

export function useListStyles(opts?: QueryOpts<Style[]>) {
  return useQuery<Style[], Error>({
    queryKey: getListStylesQueryKey(),
    queryFn: listStyles,
    ...(opts?.query ?? {}),
  });
}

export function useCreateStyle(
  opts?: MutationOpts<Style, { data: { name: string; slug: string } }>,
) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const { data: row, error } = await supabase
        .from("styles").insert(data).select("id, name, slug, created_at").single();
      if (error) throw new Error(error.message);
      return { ...(row as any), createdAt: row!.created_at, projectCount: 0 } as Style;
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useUpdateStyle(
  opts?: MutationOpts<Style, { id: string; data: { name?: string; slug?: string } }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: row, error } = await supabase
        .from("styles").update(data).eq("id", id).select("id, name, slug, created_at").single();
      if (error) throw new Error(error.message);
      return { ...(row as any), createdAt: row!.created_at, projectCount: 0 } as Style;
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useDeleteStyle(opts?: MutationOpts<{ id: string }, { id: string }>) {
  return useMutation({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from("styles").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    },
    ...(opts?.mutation ?? {}),
  });
}

// =========================================================================
// Tags
// =========================================================================
async function listTags(): Promise<Tag[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, slug, created_at, project_tags(count)")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    createdAt: r.created_at,
    projectCount: r.project_tags?.[0]?.count ?? 0,
  }));
}

export function useListTags(opts?: QueryOpts<Tag[]>) {
  return useQuery<Tag[], Error>({
    queryKey: getListTagsQueryKey(),
    queryFn: listTags,
    ...(opts?.query ?? {}),
  });
}

export function useCreateTag(
  opts?: MutationOpts<Tag, { data: { name: string; slug: string } }>,
) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const { data: row, error } = await supabase
        .from("tags").insert(data).select("id, name, slug, created_at").single();
      if (error) throw new Error(error.message);
      return { ...(row as any), createdAt: row!.created_at, projectCount: 0 } as Tag;
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useUpdateTag(
  opts?: MutationOpts<Tag, { id: string; data: { name?: string; slug?: string } }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: row, error } = await supabase
        .from("tags").update(data).eq("id", id).select("id, name, slug, created_at").single();
      if (error) throw new Error(error.message);
      return { ...(row as any), createdAt: row!.created_at, projectCount: 0 } as Tag;
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useDeleteTag(opts?: MutationOpts<{ id: string }, { id: string }>) {
  return useMutation({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    },
    ...(opts?.mutation ?? {}),
  });
}

// =========================================================================
// Projects
// =========================================================================
const PROJECT_SELECT =
  "id, title, slug, description, cover_image, status, featured, category_id, view_count, download_count, created_at, updated_at, categories(name), project_styles(style_id), project_tags(tag_id), assets(count)";

function rowToProject(r: any): Project {
  return {
    id: r.id,
    title: r.title,
    slug: r.slug,
    description: r.description ?? null,
    coverImage: r.cover_image ?? null,
    status: r.status,
    featured: r.featured,
    categoryId: r.category_id ?? null,
    categoryName: r.categories?.name ?? null,
    styleIds: (r.project_styles ?? []).map((s: any) => s.style_id),
    tagIds: (r.project_tags ?? []).map((t: any) => t.tag_id),
    viewCount: r.view_count,
    downloadCount: r.download_count,
    assetCount: r.assets?.[0]?.count ?? 0,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export type ListProjectsParams = {
  search?: string;
  status?: string;
  category_id?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
};

async function listProjects(params: ListProjectsParams = {}): Promise<{ projects: Project[]; total: number }> {
  const { search, status, category_id, featured, limit = 50, offset = 0 } = params;
  let q = supabase.from("projects").select(PROJECT_SELECT, { count: "exact" });
  if (search) q = q.ilike("title", `%${search}%`);
  if (status) q = q.eq("status", status);
  if (category_id) q = q.eq("category_id", category_id);
  if (featured !== undefined) q = q.eq("featured", featured);
  q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
  const { data, count, error } = await q;
  if (error) throw new Error(error.message);
  return { projects: (data ?? []).map(rowToProject), total: count ?? 0 };
}

export function useListProjects(
  params: ListProjectsParams = {},
  opts?: QueryOpts<{ projects: Project[]; total: number }>,
) {
  return useQuery<{ projects: Project[]; total: number }, Error>({
    queryKey: getListProjectsQueryKey(params),
    queryFn: () => listProjects(params),
    ...(opts?.query ?? {}),
  });
}

async function getProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from("projects").select(PROJECT_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToProject(data) : null;
}

export function useGetProject(id: string, opts?: QueryOpts<Project | null>) {
  return useQuery<Project | null, Error>({
    queryKey: getGetProjectQueryKey(id),
    queryFn: () => getProject(id),
    ...(opts?.query ?? {}),
  });
}

type ProjectInput = {
  title: string;
  slug: string;
  description?: string | null;
  coverImage?: string | null;
  status: string;
  featured: boolean;
  categoryId?: string | null;
  styleIds: string[];
  tagIds: string[];
};

async function syncJoinTable(table: string, idCol: string, projectId: string, ids: string[]) {
  const { error: delErr } = await supabase.from(table).delete().eq("project_id", projectId);
  if (delErr) throw new Error(delErr.message);
  if (ids.length === 0) return;
  const { error: insErr } = await supabase
    .from(table).insert(ids.map((id) => ({ project_id: projectId, [idCol]: id })));
  if (insErr) throw new Error(insErr.message);
}

export function useCreateProject(opts?: MutationOpts<Project, { data: ProjectInput }>) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const { data: row, error } = await supabase
        .from("projects")
        .insert({
          title: data.title,
          slug: data.slug,
          description: data.description ?? null,
          cover_image: data.coverImage ?? null,
          status: data.status,
          featured: data.featured,
          category_id: data.categoryId ?? null,
        })
        .select("id").single();
      if (error) throw new Error(error.message);
      const id = (row as any).id as string;
      if (data.styleIds.length) await syncJoinTable("project_styles", "style_id", id, data.styleIds);
      if (data.tagIds.length) await syncJoinTable("project_tags", "tag_id", id, data.tagIds);
      const full = await getProject(id);
      if (!full) throw new Error("Project not found after create");
      return full;
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useUpdateProject(
  opts?: MutationOpts<Project, { id: string; data: Partial<ProjectInput> }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const update: Record<string, unknown> = {};
      if (data.title !== undefined) update.title = data.title;
      if (data.slug !== undefined) update.slug = data.slug;
      if (data.description !== undefined) update.description = data.description;
      if (data.coverImage !== undefined) update.cover_image = data.coverImage;
      if (data.status !== undefined) update.status = data.status;
      if (data.featured !== undefined) update.featured = data.featured;
      if (data.categoryId !== undefined) update.category_id = data.categoryId;
      if (Object.keys(update).length) {
        const { error } = await supabase.from("projects").update(update).eq("id", id);
        if (error) throw new Error(error.message);
      }
      if (data.styleIds !== undefined) await syncJoinTable("project_styles", "style_id", id, data.styleIds);
      if (data.tagIds !== undefined) await syncJoinTable("project_tags", "tag_id", id, data.tagIds);
      const full = await getProject(id);
      if (!full) throw new Error("Project not found after update");
      return full;
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useDeleteProject(opts?: MutationOpts<{ id: string }, { id: string }>) {
  return useMutation({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    },
    ...(opts?.mutation ?? {}),
  });
}

function statusMutation(opts: MutationOpts<Project, { id: string }> | undefined, status: string) {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase.from("projects").update({ status }).eq("id", id);
      if (error) throw new Error(error.message);
      const full = await getProject(id);
      if (!full) throw new Error("Project not found");
      return full;
    },
    ...(opts?.mutation ?? {}),
  });
}

export function usePublishProject(opts?: MutationOpts<Project, { id: string }>) {
  return statusMutation(opts, "published");
}
export function useUnpublishProject(opts?: MutationOpts<Project, { id: string }>) {
  return statusMutation(opts, "draft");
}

export function useToggleProjectFeatured(opts?: MutationOpts<Project, { id: string }>) {
  return useMutation({
    mutationFn: async ({ id }) => {
      const { data: cur, error: e1 } = await supabase
        .from("projects").select("featured").eq("id", id).single();
      if (e1) throw new Error(e1.message);
      const { error: e2 } = await supabase
        .from("projects").update({ featured: !(cur as any).featured }).eq("id", id);
      if (e2) throw new Error(e2.message);
      const full = await getProject(id);
      if (!full) throw new Error("Project not found");
      return full;
    },
    ...(opts?.mutation ?? {}),
  });
}

// =========================================================================
// Assets
// =========================================================================
const ASSET_SELECT =
  "id, name, url, project_id, is_premium, sort_order, file_type, file_size, created_at, projects(title)";

function rowToAsset(r: any): Asset {
  return {
    id: r.id,
    name: r.name,
    url: r.url,
    projectId: r.project_id,
    projectTitle: r.projects?.title ?? null,
    isPremium: r.is_premium,
    sortOrder: r.sort_order,
    fileType: r.file_type ?? null,
    fileSize: r.file_size ?? null,
    createdAt: r.created_at,
  };
}

export type ListAssetsParams = {
  project_id?: string;
  is_premium?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export function useListAssets(
  params: ListAssetsParams = {},
  opts?: QueryOpts<{ assets: Asset[]; total: number }>,
) {
  return useQuery<{ assets: Asset[]; total: number }, Error>({
    queryKey: getListAssetsQueryKey(params),
    queryFn: async () => {
      const { project_id, is_premium, search, limit = 50, offset = 0 } = params;
      let q = supabase.from("assets").select(ASSET_SELECT, { count: "exact" });
      if (project_id) q = q.eq("project_id", project_id);
      if (is_premium !== undefined) q = q.eq("is_premium", is_premium);
      if (search) q = q.ilike("name", `%${search}%`);
      q = q.order("created_at", { ascending: false }).range(offset, offset + limit - 1);
      const { data, count, error } = await q;
      if (error) throw new Error(error.message);
      return { assets: (data ?? []).map(rowToAsset), total: count ?? 0 };
    },
    ...(opts?.query ?? {}),
  });
}

type CreateAssetInput = {
  name: string;
  url: string;
  projectId: string;
  isPremium: boolean;
  sortOrder: number;
  fileType?: string | null;
  fileSize?: number | null;
};

export function useCreateAsset(opts?: MutationOpts<Asset, { data: CreateAssetInput }>) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const { data: row, error } = await supabase
        .from("assets")
        .insert({
          name: data.name,
          url: data.url,
          project_id: data.projectId,
          is_premium: data.isPremium,
          sort_order: data.sortOrder,
          file_type: data.fileType ?? null,
          file_size: data.fileSize ?? null,
        })
        .select(ASSET_SELECT).single();
      if (error) throw new Error(error.message);
      return rowToAsset(row);
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useUpdateAsset(
  opts?: MutationOpts<
    Asset,
    { id: string; data: Partial<{ name: string; isPremium: boolean; sortOrder: number; projectId: string }> }
  >,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const payload: Record<string, unknown> = {};
      if (data.name !== undefined) payload.name = data.name;
      if (data.isPremium !== undefined) payload.is_premium = data.isPremium;
      if (data.sortOrder !== undefined) payload.sort_order = data.sortOrder;
      if (data.projectId !== undefined) payload.project_id = data.projectId;
      const { data: row, error } = await supabase
        .from("assets").update(payload).eq("id", id).select(ASSET_SELECT).single();
      if (error) throw new Error(error.message);
      return rowToAsset(row);
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useDeleteAsset(opts?: MutationOpts<{ id: string }, { id: string }>) {
  return useMutation({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from("assets").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return { id };
    },
    ...(opts?.mutation ?? {}),
  });
}

export function useBulkUpdateAssets(
  opts?: MutationOpts<
    { updated: number },
    { data: { ids: string[]; action: "delete" | "mark_premium" | "unmark_premium" | "move_project"; projectId?: string } }
  >,
) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const { ids, action, projectId } = data;
      if (!ids.length) return { updated: 0 };
      if (action === "delete") {
        const { error, count } = await supabase
          .from("assets").delete({ count: "exact" }).in("id", ids);
        if (error) throw new Error(error.message);
        return { updated: count ?? 0 };
      }
      let payload: Record<string, unknown> = {};
      if (action === "mark_premium") payload = { is_premium: true };
      else if (action === "unmark_premium") payload = { is_premium: false };
      else if (action === "move_project" && projectId) payload = { project_id: projectId };
      else return { updated: 0 };
      const { error, count } = await supabase
        .from("assets").update(payload, { count: "exact" }).in("id", ids);
      if (error) throw new Error(error.message);
      return { updated: count ?? 0 };
    },
    ...(opts?.mutation ?? {}),
  });
}

// =========================================================================
// Users
// =========================================================================
export function useListUsers(
  params: { search?: string; role?: string } = {},
  opts?: QueryOpts<User[]>,
) {
  return useQuery<User[], Error>({
    queryKey: getListUsersQueryKey(params),
    queryFn: async () => {
      let q = supabase
        .from("profiles")
        .select("id, email, full_name, role, avatar_url, created_at")
        .order("created_at", { ascending: false });
      if (params.search) q = q.or(`email.ilike.%${params.search}%,full_name.ilike.%${params.search}%`);
      if (params.role) q = q.eq("role", params.role);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any) => ({
        id: r.id,
        email: r.email,
        fullName: r.full_name ?? null,
        role: r.role,
        avatarUrl: r.avatar_url ?? null,
        createdAt: r.created_at,
      }));
    },
    ...(opts?.query ?? {}),
  });
}

export function useUpdateUserRole(
  opts?: MutationOpts<User, { id: string; data: { role: "admin" | "editor" | "user" } }>,
) {
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const { data: row, error } = await supabase
        .from("profiles")
        .update({ role: data.role })
        .eq("id", id)
        .select("id, email, full_name, role, avatar_url, created_at")
        .single();
      if (error) throw new Error(error.message);
      const r: any = row;
      return {
        id: r.id, email: r.email, fullName: r.full_name ?? null,
        role: r.role, avatarUrl: r.avatar_url ?? null, createdAt: r.created_at,
      };
    },
    ...(opts?.mutation ?? {}),
  });
}

// =========================================================================
// Settings
// =========================================================================
export function useGetSettings(opts?: QueryOpts<Settings>) {
  return useQuery<Settings, Error>({
    queryKey: getGetSettingsQueryKey(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("site_name, logo_url, contact_email, featured_items_count, seo_title, seo_description")
        .limit(1).maybeSingle();
      if (error) throw new Error(error.message);
      const r: any = data ?? {};
      return {
        siteName: r.site_name ?? "GetIllustra",
        logoUrl: r.logo_url ?? null,
        contactEmail: r.contact_email ?? null,
        featuredItemsCount: r.featured_items_count ?? 6,
        seoTitle: r.seo_title ?? null,
        seoDescription: r.seo_description ?? null,
      };
    },
    ...(opts?.query ?? {}),
  });
}

export function useUpdateSettings(
  opts?: MutationOpts<Settings, { data: Partial<Settings> }>,
) {
  return useMutation({
    mutationFn: async ({ data }) => {
      const { data: existing, error: e1 } = await supabase
        .from("settings").select("id").limit(1).maybeSingle();
      if (e1) throw new Error(e1.message);
      const payload: Record<string, unknown> = {};
      if (data.siteName !== undefined) payload.site_name = data.siteName;
      if (data.logoUrl !== undefined) payload.logo_url = data.logoUrl;
      if (data.contactEmail !== undefined) payload.contact_email = data.contactEmail;
      if (data.featuredItemsCount !== undefined) payload.featured_items_count = data.featuredItemsCount;
      if (data.seoTitle !== undefined) payload.seo_title = data.seoTitle;
      if (data.seoDescription !== undefined) payload.seo_description = data.seoDescription;

      let row: any;
      if (existing?.id) {
        const { data: updated, error } = await supabase
          .from("settings").update(payload).eq("id", (existing as any).id)
          .select("site_name, logo_url, contact_email, featured_items_count, seo_title, seo_description")
          .single();
        if (error) throw new Error(error.message);
        row = updated;
      } else {
        const { data: created, error } = await supabase
          .from("settings").insert(payload)
          .select("site_name, logo_url, contact_email, featured_items_count, seo_title, seo_description")
          .single();
        if (error) throw new Error(error.message);
        row = created;
      }
      return {
        siteName: row.site_name,
        logoUrl: row.logo_url ?? null,
        contactEmail: row.contact_email ?? null,
        featuredItemsCount: row.featured_items_count,
        seoTitle: row.seo_title ?? null,
        seoDescription: row.seo_description ?? null,
      };
    },
    ...(opts?.mutation ?? {}),
  });
}

// =========================================================================
// Dashboard / Analytics
// =========================================================================
type TrendPoint = { date: string; value: number };

export function useGetDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("dashboard_stats");
      if (error) throw new Error(error.message);
      const r: any = (data ?? [])[0] ?? {};
      return {
        totalProjects: r.total_projects ?? 0,
        totalAssets: r.total_assets ?? 0,
        publishedProjects: r.published_projects ?? 0,
        totalUsers: r.total_users ?? 0,
        downloadsThisMonth: r.downloads_this_month ?? 0,
      };
    },
  });
}

export type ActivityItem = {
  id: string;
  type: "upload" | "edit" | "new_user" | "publish" | "delete";
  description: string;
  timestamp: string;
  userId?: string;
  userName?: string;
};

export function useGetRecentActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: ["dashboard", "recent-activity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("recent_activity");
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any) => ({
        id: r.id,
        type: r.type as ActivityItem["type"],
        description: r.description,
        timestamp: r.timestamp,
        userId: r.user_id ?? undefined,
        userName: r.user_name ?? undefined,
      }));
    },
  });
}

export function useGetUploadTrend() {
  return useQuery<TrendPoint[]>({
    queryKey: ["dashboard", "upload-trend"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("upload_trend", { days: 30 });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any) => ({ date: r.date, value: r.value }));
    },
  });
}

export function useGetTopCategories() {
  return useQuery({
    queryKey: ["dashboard", "top-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("top_categories", { lim: 8 });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any) => ({ id: r.id, name: r.name, count: r.count }));
    },
  });
}

export function useGetMostViewedProjects() {
  return useQuery({
    queryKey: ["analytics", "most-viewed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, cover_image, view_count")
        .order("view_count", { ascending: false })
        .limit(10);
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any) => ({
        id: r.id, title: r.title, coverImage: r.cover_image ?? null, viewCount: r.view_count,
      }));
    },
  });
}

export function useGetMostDownloadedAssets() {
  return useQuery({
    queryKey: ["analytics", "most-downloaded"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("most_downloaded_assets", { lim: 10 });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name,
        projectTitle: r.project_title ?? null,
        downloadCount: r.download_count,
      }));
    },
  });
}

export function useGetUserGrowth() {
  return useQuery<TrendPoint[]>({
    queryKey: ["analytics", "user-growth"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("user_growth", { days: 90 });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any) => ({ date: r.date, value: r.value }));
    },
  });
}

export function useGetSavesTrend() {
  return useQuery<TrendPoint[]>({
    queryKey: ["analytics", "saves-trend"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("saves_trend", { days: 90 });
      if (error) throw new Error(error.message);
      return (data ?? []).map((r: any) => ({ date: r.date, value: r.value }));
    },
  });
}

// =========================================================================
// Storage upload helper (used by assets page)
// =========================================================================
export async function uploadAssetFile(file: File): Promise<{ url: string; path: string }> {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}`;
  const { error } = await supabase.storage.from("assets").upload(path, file, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("assets").getPublicUrl(path);
  return { url: data.publicUrl, path };
}

// Re-export for any leftover users; explicitly unused.
export { unwrap as _unwrap };

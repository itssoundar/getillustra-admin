import { useState, useEffect } from "react";
import { useParams, useLocation, Link } from "wouter";
import {
  useGetProject,
  useUpdateProject,
  useListCategories,
  useListStyles,
  useListTags,
  useListAssets,
  useCreateAsset,
  useDeleteAsset,
  getGetProjectQueryKey,
  getListAssetsQueryKey,
} from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, Plus } from "lucide-react";

function slugify(t: string) { return t.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""); }

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [newAssetUrl, setNewAssetUrl] = useState("");
  const [newAssetName, setNewAssetName] = useState("");

  const { data: project, isLoading } = useGetProject(id!, {
    query: { enabled: !!id, queryKey: getGetProjectQueryKey(id!) },
  });
  const assetParams = { project_id: id, limit: 50, offset: 0 };
  const { data: assetsData } = useListAssets(assetParams, { query: { queryKey: getListAssetsQueryKey(assetParams), enabled: !!id } });
  const assets = assetsData?.assets ?? [];

  const { data: categories = [] } = useListCategories();
  const { data: styles = [] } = useListStyles();
  const { data: tags = [] } = useListTags();

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    coverImage: "",
    status: "draft" as "draft" | "published",
    featured: false,
    categoryId: "",
    styleIds: [] as string[],
    tagIds: [] as string[],
  });

  useEffect(() => {
    if (project) {
      setForm({
        title: project.title,
        slug: project.slug,
        description: project.description ?? "",
        coverImage: project.coverImage ?? "",
        status: project.status as "draft" | "published",
        featured: project.featured,
        categoryId: project.categoryId ?? "",
        styleIds: project.styleIds,
        tagIds: project.tagIds,
      });
    }
  }, [project]);

  const updateProject = useUpdateProject({
    mutation: {
      onSuccess: () => {
        toast.success("Project updated");
        queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(id!) });
      },
      onError: () => toast.error("Failed to update"),
    },
  });

  const createAsset = useCreateAsset({
    mutation: {
      onSuccess: () => {
        toast.success("Asset added");
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey(assetParams) });
        setNewAssetUrl("");
        setNewAssetName("");
      },
      onError: () => toast.error("Failed to add asset"),
    },
  });

  const deleteAsset = useDeleteAsset({
    mutation: {
      onSuccess: () => {
        toast.success("Asset removed");
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey(assetParams) });
        setDeleteAssetId(null);
      },
    },
  });

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));
  const toggleMulti = (field: "styleIds" | "tagIds", vid: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(vid) ? prev[field].filter((i) => i !== vid) : [...prev[field], vid],
    }));
  };

  const handleSave = () => {
    updateProject.mutate({
      id: id!,
      data: {
        title: form.title,
        slug: form.slug,
        description: form.description || undefined,
        coverImage: form.coverImage || null,
        status: form.status,
        featured: form.featured,
        categoryId: form.categoryId || null,
        styleIds: form.styleIds,
        tagIds: form.tagIds,
      },
    });
  };

  const handleAddAsset = () => {
    if (!newAssetUrl || !id) return;
    createAsset.mutate({
      data: {
        name: newAssetName || "Asset",
        url: newAssetUrl,
        projectId: id,
        isPremium: false,
        sortOrder: assets.length,
      },
    });
  };

  if (isLoading) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><Skeleton className="h-96 w-full" /></div>;
  }

  if (!project) {
    return <div className="text-center py-12 text-muted-foreground">Project not found</div>;
  }

  return (
    <div className="space-y-6 max-w-2xl" data-testid="edit-project-page">
      <div className="flex items-center gap-3">
        <Link href="/projects"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Edit Project</h1>
          <p className="text-sm text-muted-foreground mt-1">{project.title}</p>
        </div>
      </div>

      <div className="space-y-4 border rounded-lg p-6">
        <div className="space-y-1.5"><Label>Title *</Label><Input data-testid="project-title" value={form.title} onChange={(e) => update("title", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Slug *</Label><Input data-testid="project-slug" value={form.slug} onChange={(e) => update("slug", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Description</Label><Textarea data-testid="project-description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} /></div>
        <div className="space-y-1.5"><Label>Cover Image URL</Label><Input data-testid="project-cover" value={form.coverImage} onChange={(e) => update("coverImage", e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.categoryId} onValueChange={(v) => update("categoryId", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent><SelectItem value="none">None</SelectItem>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3"><Switch checked={form.featured} onCheckedChange={(v) => update("featured", v)} /><Label>Featured</Label></div>
        {styles.length > 0 && (
          <div className="space-y-2">
            <Label>Styles</Label>
            <div className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 cursor-pointer border rounded-md px-3 py-1.5 text-sm hover:bg-muted/50">
                  <Checkbox checked={form.styleIds.includes(s.id)} onCheckedChange={() => toggleMulti("styleIds", s.id)} />
                  {s.name}
                </label>
              ))}
            </div>
          </div>
        )}
        {tags.length > 0 && (
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <label key={t.id} className="flex items-center gap-1.5 cursor-pointer border rounded-md px-3 py-1.5 text-sm hover:bg-muted/50">
                  <Checkbox checked={form.tagIds.includes(t.id)} onCheckedChange={() => toggleMulti("tagIds", t.id)} />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <Button data-testid="save-project" onClick={handleSave} disabled={updateProject.isPending}>
        {updateProject.isPending ? "Saving..." : "Save Changes"}
      </Button>

      <div className="space-y-4 border rounded-lg p-6">
        <h2 className="font-semibold">Assets ({assets.length})</h2>
        <div className="space-y-2">
          {assets.map((asset) => (
            <div key={asset.id} className="flex items-center gap-3 p-2 border rounded-md" data-testid={`asset-item-${asset.id}`}>
              <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
              </div>
              <span className="flex-1 text-sm font-medium truncate">{asset.name}</span>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteAssetId(asset.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Input value={newAssetName} onChange={(e) => setNewAssetName(e.target.value)} placeholder="Asset name" className="w-40" />
          <Input data-testid="new-asset-url" value={newAssetUrl} onChange={(e) => setNewAssetUrl(e.target.value)} placeholder="URL..." className="flex-1" />
          <Button onClick={handleAddAsset} disabled={!newAssetUrl || createAsset.isPending} size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button>
        </div>
      </div>

      <AlertDialog open={!!deleteAssetId} onOpenChange={(o) => !o && setDeleteAssetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete asset?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteAssetId && deleteAsset.mutate({ id: deleteAssetId })}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

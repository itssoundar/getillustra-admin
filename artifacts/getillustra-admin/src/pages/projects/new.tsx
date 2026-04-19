import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateProject, useListCategories, useListStyles, useListTags } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

function slugify(t: string) { return t.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""); }

export default function NewProjectPage() {
  const [, setLocation] = useLocation();
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

  const { data: categories = [] } = useListCategories();
  const { data: styles = [] } = useListStyles();
  const { data: tags = [] } = useListTags();

  const createProject = useCreateProject({
    mutation: {
      onSuccess: (project) => {
        toast.success("Project created");
        setLocation(`/projects/${project.id}/edit`);
      },
      onError: () => toast.error("Failed to create project"),
    },
  });

  const update = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const toggleMulti = (field: "styleIds" | "tagIds", id: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(id) ? prev[field].filter((i) => i !== id) : [...prev[field], id],
    }));
  };

  const handleSubmit = () => {
    createProject.mutate({
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

  return (
    <div className="space-y-6 max-w-2xl" data-testid="new-project-page">
      <div className="flex items-center gap-3">
        <Link href="/projects"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Project</h1>
          <p className="text-sm text-muted-foreground mt-1">Fill in the details to create a new illustration project</p>
        </div>
      </div>

      <div className="space-y-4 border rounded-lg p-6">
        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input data-testid="project-title" value={form.title} onChange={(e) => { update("title", e.target.value); update("slug", slugify(e.target.value)); }} placeholder="e.g. Dashboard UI Kit" />
        </div>
        <div className="space-y-1.5">
          <Label>Slug *</Label>
          <Input data-testid="project-slug" value={form.slug} onChange={(e) => update("slug", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea data-testid="project-description" value={form.description} onChange={(e) => update("description", e.target.value)} rows={4} />
        </div>
        <div className="space-y-1.5">
          <Label>Cover Image URL</Label>
          <Input data-testid="project-cover" value={form.coverImage} onChange={(e) => update("coverImage", e.target.value)} placeholder="https://..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => update("status", v)}>
              <SelectTrigger data-testid="project-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.categoryId} onValueChange={(v) => update("categoryId", v === "none" ? "" : v)}>
              <SelectTrigger data-testid="project-category"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Switch data-testid="project-featured" checked={form.featured} onCheckedChange={(v) => update("featured", v)} />
          <Label>Featured</Label>
        </div>

        {styles.length > 0 && (
          <div className="space-y-2">
            <Label>Styles</Label>
            <div className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <label key={s.id} className="flex items-center gap-1.5 cursor-pointer border rounded-md px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors">
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
                <label key={t.id} className="flex items-center gap-1.5 cursor-pointer border rounded-md px-3 py-1.5 text-sm hover:bg-muted/50 transition-colors">
                  <Checkbox checked={form.tagIds.includes(t.id)} onCheckedChange={() => toggleMulti("tagIds", t.id)} />
                  {t.name}
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button data-testid="create-project" onClick={handleSubmit} disabled={!form.title || !form.slug || createProject.isPending}>
          {createProject.isPending ? "Creating..." : "Create Project"}
        </Button>
        <Link href="/projects"><Button variant="outline">Cancel</Button></Link>
      </div>
    </div>
  );
}

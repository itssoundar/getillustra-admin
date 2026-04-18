import { useState } from "react";
import {
  useListCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, FolderTree } from "lucide-react";
import { format } from "date-fns";

type Category = { id: string; name: string; slug: string; description: string | null; projectCount: number; createdAt: string };

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

function CategoryForm({
  initial,
  onSave,
  onCancel,
  isPending,
}: {
  initial?: Partial<Category>;
  onSave: (data: { name: string; slug: string; description?: string | null }) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initial?.id) setSlug(slugify(val));
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input data-testid="category-name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g. Business" />
      </div>
      <div className="space-y-1.5">
        <Label>Slug</Label>
        <Input data-testid="category-slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="business" />
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Input data-testid="category-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          data-testid="save-category"
          onClick={() => onSave({ name, slug, description: description || null })}
          disabled={!name || !slug || isPending}
        >
          Save
        </Button>
      </DialogFooter>
    </div>
  );
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useListCategories();

  const createCategory = useCreateCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Category created");
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        setCreating(false);
      },
      onError: () => toast.error("Failed to create category"),
    },
  });

  const updateCategory = useUpdateCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Category updated");
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        setEditing(null);
      },
      onError: () => toast.error("Failed to update category"),
    },
  });

  const deleteCategory = useDeleteCategory({
    mutation: {
      onSuccess: () => {
        toast.success("Category deleted");
        queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
        setDeleteId(null);
      },
      onError: () => toast.error("Failed to delete category"),
    },
  });

  return (
    <div className="space-y-6" data-testid="categories-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">{categories.length} categories</p>
        </div>
        <Button data-testid="add-category" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Description</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Projects</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="w-20 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4 py-3"><Skeleton className="h-7 w-full" /></td></tr>
              ))
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center">
                  <FolderTree className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-muted-foreground text-sm">No categories yet</p>
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-muted/20 transition-colors" data-testid={`category-row-${cat.id}`}>
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{cat.slug}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">{cat.description ?? "—"}</td>
                  <td className="px-4 py-3">{cat.projectCount}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(cat.createdAt), "MMM d, yyyy")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(cat as Category)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(cat.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
          <CategoryForm
            onSave={(data) => createCategory.mutate({ data })}
            onCancel={() => setCreating(false)}
            isPending={createCategory.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Category</DialogTitle></DialogHeader>
          {editing && (
            <CategoryForm
              initial={editing}
              onSave={(data) => updateCategory.mutate({ id: editing.id, data })}
              onCancel={() => setEditing(null)}
              isPending={updateCategory.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>Projects in this category will be unassigned.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground"
              onClick={() => deleteId && deleteCategory.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

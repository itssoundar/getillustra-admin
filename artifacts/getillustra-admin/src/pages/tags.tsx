import { useState } from "react";
import { useListTags, useCreateTag, useUpdateTag, useDeleteTag, getListTagsQueryKey } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Tags as TagsIcon } from "lucide-react";

type Tag = { id: string; name: string; slug: string; projectCount: number; createdAt: string };
function slugify(t: string) { return t.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""); }

function TagForm({ initial, onSave, onCancel, isPending }: { initial?: Partial<Tag>; onSave: (d: { name: string; slug: string }) => void; onCancel: () => void; isPending: boolean }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  return (
    <div className="space-y-4">
      <div className="space-y-1.5"><Label>Name</Label><Input data-testid="tag-name" value={name} onChange={(e) => { setName(e.target.value); if (!initial?.id) setSlug(slugify(e.target.value)); }} /></div>
      <div className="space-y-1.5"><Label>Slug</Label><Input data-testid="tag-slug" value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
      <DialogFooter><Button variant="outline" onClick={onCancel}>Cancel</Button><Button data-testid="save-tag" onClick={() => onSave({ name, slug })} disabled={!name || !slug || isPending}>Save</Button></DialogFooter>
    </div>
  );
}

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Tag | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: tags = [], isLoading } = useListTags();
  const createTag = useCreateTag({ mutation: { onSuccess: () => { toast.success("Tag created"); queryClient.invalidateQueries({ queryKey: getListTagsQueryKey() }); setCreating(false); } } });
  const updateTag = useUpdateTag({ mutation: { onSuccess: () => { toast.success("Tag updated"); queryClient.invalidateQueries({ queryKey: getListTagsQueryKey() }); setEditing(null); } } });
  const deleteTag = useDeleteTag({ mutation: { onSuccess: () => { toast.success("Tag deleted"); queryClient.invalidateQueries({ queryKey: getListTagsQueryKey() }); setDeleteId(null); } } });

  return (
    <div className="space-y-6" data-testid="tags-page">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Tags</h1><p className="text-sm text-muted-foreground mt-1">{tags.length} tags</p></div>
        <Button data-testid="add-tag" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-2" />Add Tag</Button>
      </div>
      <div className="flex flex-wrap gap-3">
        {isLoading ? Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-8 w-24 rounded-full" />) :
        tags.length === 0 ? <div className="w-full py-12 text-center"><TagsIcon className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" /><p className="text-muted-foreground text-sm">No tags yet</p></div> :
        tags.map((tag) => (
          <div key={tag.id} className="flex items-center gap-1 border rounded-full px-3 py-1.5" data-testid={`tag-item-${tag.id}`}>
            <span className="text-sm font-medium">{tag.name}</span>
            <Badge variant="secondary" className="text-xs ml-1">{tag.projectCount}</Badge>
            <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={() => setEditing(tag as Tag)}><Pencil className="h-3 w-3" /></Button>
            <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive hover:text-destructive" onClick={() => setDeleteId(tag.id)}><Trash2 className="h-3 w-3" /></Button>
          </div>
        ))}
      </div>
      <Dialog open={creating} onOpenChange={setCreating}><DialogContent><DialogHeader><DialogTitle>New Tag</DialogTitle></DialogHeader><TagForm onSave={(d) => createTag.mutate({ data: d })} onCancel={() => setCreating(false)} isPending={createTag.isPending} /></DialogContent></Dialog>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit Tag</DialogTitle></DialogHeader>{editing && <TagForm initial={editing} onSave={(d) => updateTag.mutate({ id: editing.id, data: d })} onCancel={() => setEditing(null)} isPending={updateTag.isPending} />}</DialogContent></Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete tag?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && deleteTag.mutate({ id: deleteId })}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

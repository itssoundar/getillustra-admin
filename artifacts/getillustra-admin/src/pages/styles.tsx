import { useState } from "react";
import {
  useListStyles,
  useCreateStyle,
  useUpdateStyle,
  useDeleteStyle,
  getListStylesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Plus, Palette } from "lucide-react";
import { format } from "date-fns";

type Style = { id: string; name: string; slug: string; projectCount: number; createdAt: string };

function slugify(t: string) { return t.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""); }

function StyleForm({ initial, onSave, onCancel, isPending }: { initial?: Partial<Style>; onSave: (d: { name: string; slug: string }) => void; onCancel: () => void; isPending: boolean }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  return (
    <div className="space-y-4">
      <div className="space-y-1.5"><Label>Name</Label><Input data-testid="style-name" value={name} onChange={(e) => { setName(e.target.value); if (!initial?.id) setSlug(slugify(e.target.value)); }} placeholder="e.g. Flat" /></div>
      <div className="space-y-1.5"><Label>Slug</Label><Input data-testid="style-slug" value={slug} onChange={(e) => setSlug(e.target.value)} /></div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button data-testid="save-style" onClick={() => onSave({ name, slug })} disabled={!name || !slug || isPending}>Save</Button>
      </DialogFooter>
    </div>
  );
}

export default function StylesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<Style | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: styles = [], isLoading } = useListStyles();
  const createStyle = useCreateStyle({ mutation: { onSuccess: () => { toast.success("Style created"); queryClient.invalidateQueries({ queryKey: getListStylesQueryKey() }); setCreating(false); }, onError: () => toast.error("Failed") } });
  const updateStyle = useUpdateStyle({ mutation: { onSuccess: () => { toast.success("Style updated"); queryClient.invalidateQueries({ queryKey: getListStylesQueryKey() }); setEditing(null); }, onError: () => toast.error("Failed") } });
  const deleteStyle = useDeleteStyle({ mutation: { onSuccess: () => { toast.success("Style deleted"); queryClient.invalidateQueries({ queryKey: getListStylesQueryKey() }); setDeleteId(null); }, onError: () => toast.error("Failed") } });

  return (
    <div className="space-y-6" data-testid="styles-page">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Styles</h1><p className="text-sm text-muted-foreground mt-1">{styles.length} styles</p></div>
        <Button data-testid="add-style" onClick={() => setCreating(true)}><Plus className="h-4 w-4 mr-2" />Add Style</Button>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Slug</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Projects</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
            <th className="w-20 px-4 py-3" />
          </tr></thead>
          <tbody className="divide-y">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (<tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-7 w-full" /></td></tr>)) :
            styles.length === 0 ? (<tr><td colSpan={5} className="px-4 py-12 text-center"><Palette className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" /><p className="text-muted-foreground text-sm">No styles yet</p></td></tr>) :
            styles.map((s) => (<tr key={s.id} className="hover:bg-muted/20 transition-colors" data-testid={`style-row-${s.id}`}>
              <td className="px-4 py-3 font-medium">{s.name}</td>
              <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{s.slug}</td>
              <td className="px-4 py-3">{s.projectCount}</td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(s.createdAt), "MMM d, yyyy")}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-1 justify-end">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(s as Style)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setDeleteId(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div></td>
            </tr>))}
          </tbody>
        </table>
      </div>
      <Dialog open={creating} onOpenChange={setCreating}><DialogContent><DialogHeader><DialogTitle>New Style</DialogTitle></DialogHeader><StyleForm onSave={(d) => createStyle.mutate({ data: d })} onCancel={() => setCreating(false)} isPending={createStyle.isPending} /></DialogContent></Dialog>
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}><DialogContent><DialogHeader><DialogTitle>Edit Style</DialogTitle></DialogHeader>{editing && <StyleForm initial={editing} onSave={(d) => updateStyle.mutate({ id: editing.id, data: d })} onCancel={() => setEditing(null)} isPending={updateStyle.isPending} />}</DialogContent></Dialog>
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete style?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && deleteStyle.mutate({ id: deleteId })}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
}

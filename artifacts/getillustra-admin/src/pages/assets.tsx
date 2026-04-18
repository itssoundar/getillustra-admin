import { useState } from "react";
import { useListAssets, useDeleteAsset, useBulkUpdateAssets, getListAssetsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, Trash2, Star, Move } from "lucide-react";
import { format } from "date-fns";

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<string | null>(null);

  const params = { search: search || undefined, limit: 50, offset: 0 };
  const { data, isLoading } = useListAssets(params, { query: { queryKey: getListAssetsQueryKey(params) } });
  const assets = data?.assets ?? [];
  const total = data?.total ?? 0;

  const deleteAsset = useDeleteAsset({
    mutation: {
      onSuccess: () => {
        toast.success("Asset deleted");
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey(params) });
        setDeleteId(null);
      },
      onError: () => toast.error("Failed to delete asset"),
    },
  });

  const bulkUpdate = useBulkUpdateAssets({
    mutation: {
      onSuccess: (result) => {
        toast.success(`${result.updated} assets updated`);
        queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey(params) });
        setSelectedIds([]);
        setBulkAction(null);
      },
      onError: () => toast.error("Bulk action failed"),
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds((prev) => (prev.length === assets.length ? [] : assets.map((a) => a.id)));
  };

  const handleBulkDelete = () => {
    bulkUpdate.mutate({ data: { ids: selectedIds, action: "delete" } });
  };

  const handleBulkPremium = () => {
    bulkUpdate.mutate({ data: { ids: selectedIds, action: "mark_premium" } });
  };

  return (
    <div className="space-y-6" data-testid="assets-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total assets</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            data-testid="search-assets"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{selectedIds.length} selected</span>
            <Button size="sm" variant="outline" onClick={handleBulkPremium} disabled={bulkUpdate.isPending}>
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Mark Premium
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setBulkAction("delete")} disabled={bulkUpdate.isPending}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="w-10 px-4 py-3">
                <Checkbox
                  data-testid="select-all-assets"
                  checked={selectedIds.length === assets.length && assets.length > 0}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Preview</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Project</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Premium</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={7} className="px-4 py-3">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  No assets found
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr key={asset.id} className="hover:bg-muted/20 transition-colors" data-testid={`asset-row-${asset.id}`}>
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.includes(asset.id)}
                      onCheckedChange={() => toggleSelect(asset.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex-shrink-0">
                      <img src={asset.url} alt={asset.name} className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{asset.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{asset.projectTitle ?? "—"}</td>
                  <td className="px-4 py-3">
                    {asset.isPremium ? (
                      <Badge variant="default" className="text-xs">Premium</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Free</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {format(new Date(asset.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(asset.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteAsset.mutate({ id: deleteId })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkAction === "delete"} onOpenChange={(open) => !open && setBulkAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} assets?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

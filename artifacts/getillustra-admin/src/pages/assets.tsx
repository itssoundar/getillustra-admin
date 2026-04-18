import { useState, useRef, useCallback } from "react";
import {
  useListAssets,
  useDeleteAsset,
  useBulkUpdateAssets,
  useCreateAsset,
  useListProjects,
  getListAssetsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Trash2,
  Star,
  Upload,
  X,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  File,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType?: string | null) {
  if (!mimeType) return <File className="h-5 w-5 text-muted-foreground" />;
  if (mimeType.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
  if (mimeType.startsWith("video/")) return <FileVideo className="h-5 w-5 text-purple-500" />;
  if (mimeType.startsWith("audio/")) return <FileAudio className="h-5 w-5 text-green-500" />;
  if (mimeType.includes("pdf") || mimeType.startsWith("text/")) return <FileText className="h-5 w-5 text-orange-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
}

function getFileTypeLabel(mimeType?: string | null) {
  if (!mimeType) return null;
  const parts = mimeType.split("/");
  return parts[1]?.toUpperCase().split("+")[0] ?? parts[0]?.toUpperCase();
}

interface PendingFile {
  file: File;
  id: string;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  objectPath?: string;
}

async function requestUploadUrl(file: File): Promise<{ uploadURL: string; objectPath: string }> {
  const res = await fetch(`${BASE_URL}/api/storage/uploads/request-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: file.name,
      size: file.size,
      contentType: file.type || "application/octet-stream",
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get upload URL");
  }
  return res.json();
}

async function uploadToGcs(file: File, uploadURL: string): Promise<void> {
  const res = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) throw new Error("Upload to storage failed");
}

export default function AssetsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkAction, setBulkAction] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [markPremium, setMarkPremium] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const params = { search: search || undefined, limit: 50, offset: 0 };
  const { data, isLoading } = useListAssets(params, {
    query: { queryKey: getListAssetsQueryKey(params) },
  });
  const assets = data?.assets ?? [];
  const total = data?.total ?? 0;

  const { data: projectsData } = useListProjects({ limit: 100, offset: 0 });
  const projects = projectsData?.projects ?? [];

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

  const createAsset = useCreateAsset();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.length === assets.length ? [] : assets.map((a) => a.id),
    );
  };

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const newPending: PendingFile[] = arr.map((file) => {
      const id = `${Date.now()}-${Math.random()}`;
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : undefined;
      return { file, id, preview, status: "pending" };
    });
    setPendingFiles((prev) => [...prev, ...newPending]);
    setUploadDialogOpen(true);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles],
  );

  const removePendingFile = (id: string) => {
    setPendingFiles((prev) => {
      const f = prev.find((p) => p.id === id);
      if (f?.preview) URL.revokeObjectURL(f.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleUpload = async () => {
    if (!selectedProjectId) {
      toast.error("Please select a project");
      return;
    }
    const pending = pendingFiles.filter((f) => f.status === "pending");
    if (!pending.length) return;

    setIsUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const pf of pending) {
      setPendingFiles((prev) =>
        prev.map((f) => (f.id === pf.id ? { ...f, status: "uploading" } : f)),
      );
      try {
        const { uploadURL, objectPath } = await requestUploadUrl(pf.file);
        await uploadToGcs(pf.file, uploadURL);
        const assetUrl = `${BASE_URL}/api/storage${objectPath}`;
        await createAsset.mutateAsync({
          data: {
            name: pf.file.name,
            url: assetUrl,
            projectId: selectedProjectId,
            isPremium: markPremium,
            sortOrder: 0,
            fileType: pf.file.type || null,
            fileSize: pf.file.size,
          },
        });
        setPendingFiles((prev) =>
          prev.map((f) =>
            f.id === pf.id ? { ...f, status: "done", objectPath } : f,
          ),
        );
        successCount++;
      } catch (err: any) {
        setPendingFiles((prev) =>
          prev.map((f) =>
            f.id === pf.id
              ? { ...f, status: "error", error: err.message || "Upload failed" }
              : f,
          ),
        );
        errorCount++;
      }
    }

    setIsUploading(false);
    queryClient.invalidateQueries({ queryKey: getListAssetsQueryKey(params) });

    if (successCount > 0) toast.success(`${successCount} asset${successCount > 1 ? "s" : ""} uploaded`);
    if (errorCount > 0) toast.error(`${errorCount} file${errorCount > 1 ? "s" : ""} failed`);

    if (errorCount === 0) {
      setTimeout(() => {
        setUploadDialogOpen(false);
        setPendingFiles([]);
        setSelectedProjectId("");
        setMarkPremium(false);
      }, 800);
    }
  };

  const closeUploadDialog = () => {
    if (isUploading) return;
    pendingFiles.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setPendingFiles([]);
    setSelectedProjectId("");
    setMarkPremium(false);
    setUploadDialogOpen(false);
  };

  return (
    <div className="space-y-6" data-testid="assets-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Assets</h1>
          <p className="text-sm text-muted-foreground mt-1">{total} total assets</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        className="hidden"
        onChange={handleFileInput}
      />

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-muted-foreground/40 hover:bg-muted/30"
        }`}
      >
        <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm font-medium text-muted-foreground">
          Drop files here or click to select
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Any format — images, vectors, PDFs, fonts, and more
        </p>
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
            <span className="text-sm text-muted-foreground">
              {selectedIds.length} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                bulkUpdate.mutate({ data: { ids: selectedIds, action: "mark_premium" } })
              }
              disabled={bulkUpdate.isPending}
            >
              <Star className="h-3.5 w-3.5 mr-1.5" />
              Mark Premium
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setBulkAction("delete")}
              disabled={bulkUpdate.isPending}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-muted/30 border-b">
            <tr>
              <th className="w-10 px-4 py-3">
                <Checkbox
                  data-testid="select-all-assets"
                  checked={selectedIds.length === assets.length && assets.length > 0}
                  onCheckedChange={toggleAll}
                />
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Preview
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Name
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Type
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Project
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Premium
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Size
              </th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                Created
              </th>
              <th className="w-10 px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={9} className="px-4 py-3">
                    <Skeleton className="h-8 w-full" />
                  </td>
                </tr>
              ))
            ) : assets.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="px-4 py-12 text-center text-muted-foreground text-sm"
                >
                  No assets yet. Upload files above to get started.
                </td>
              </tr>
            ) : (
              assets.map((asset) => (
                <tr
                  key={asset.id}
                  className="hover:bg-muted/20 transition-colors"
                  data-testid={`asset-row-${asset.id}`}
                >
                  <td className="px-4 py-3">
                    <Checkbox
                      checked={selectedIds.includes(asset.id)}
                      onCheckedChange={() => toggleSelect(asset.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="h-10 w-10 rounded-md bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {asset.fileType?.startsWith("image/") ? (
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            const el = e.target as HTMLImageElement;
                            el.style.display = "none";
                            el.parentElement!.innerHTML = `<div class="flex items-center justify-center h-full w-full text-muted-foreground"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`;
                          }}
                        />
                      ) : (
                        getFileIcon(asset.fileType)
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium max-w-[200px] truncate">
                    {asset.name}
                  </td>
                  <td className="px-4 py-3">
                    {asset.fileType ? (
                      <Badge variant="outline" className="text-xs font-mono">
                        {getFileTypeLabel(asset.fileType)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {asset.projectTitle ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {asset.isPremium ? (
                      <Badge variant="default" className="text-xs">
                        Premium
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Free
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {asset.fileSize ? formatBytes(asset.fileSize) : "—"}
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

      <Dialog open={uploadDialogOpen} onOpenChange={(open) => { if (!open) closeUploadDialog(); }}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Upload Assets</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 py-2">
            {pendingFiles.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No files selected
              </p>
            )}
            {pendingFiles.map((pf) => (
              <div
                key={pf.id}
                className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20"
              >
                <div className="h-10 w-10 rounded bg-muted flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {pf.preview ? (
                    <img
                      src={pf.preview}
                      alt={pf.file.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getFileIcon(pf.file.type)
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{pf.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(pf.file.size)}
                    {pf.file.type && (
                      <span className="ml-2 font-mono">
                        {getFileTypeLabel(pf.file.type)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  {pf.status === "pending" && (
                    <button
                      onClick={() => removePendingFile(pf.id)}
                      className="text-muted-foreground hover:text-foreground"
                      disabled={isUploading}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  {pf.status === "uploading" && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {pf.status === "done" && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  )}
                  {pf.status === "error" && (
                    <span className="text-xs text-destructive">{pf.error}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed rounded-lg p-3 text-center text-sm text-muted-foreground cursor-pointer hover:border-muted-foreground/40 hover:bg-muted/20 transition-colors"
          >
            + Add more files
          </div>

          <div className="space-y-4 pt-2 border-t">
            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={selectedProjectId}
                onValueChange={setSelectedProjectId}
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="mark-premium"
                checked={markPremium}
                onCheckedChange={(v) => setMarkPremium(!!v)}
                disabled={isUploading}
              />
              <Label htmlFor="mark-premium" className="cursor-pointer">
                Mark as Premium
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={closeUploadDialog} disabled={isUploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={
                isUploading ||
                !selectedProjectId ||
                pendingFiles.filter((f) => f.status === "pending").length === 0
              }
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {pendingFiles.filter((f) => f.status === "pending").length} File
                  {pendingFiles.filter((f) => f.status === "pending").length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
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

      <AlertDialog
        open={bulkAction === "delete"}
        onOpenChange={(open) => !open && setBulkAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} assets?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                bulkUpdate.mutate({ data: { ids: selectedIds, action: "delete" } })
              }
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useState } from "react";
import { Link } from "wouter";
import { 
  useListProjects, 
  useDeleteProject, 
  usePublishProject, 
  useUnpublishProject, 
  useToggleProjectFeatured,
  getListProjectsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash, 
  Eye, 
  EyeOff, 
  Star, 
  Image as ImageIcon 
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

export default function ProjectsList() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useListProjects({ search });
  
  const deleteMutation = useDeleteProject({
    mutation: {
      onSuccess: () => {
        toast.success("Project deleted successfully");
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
        setDeleteId(null);
      },
      onError: (err: any) => {
        toast.error(err.message || "Failed to delete project");
      }
    }
  });

  const publishMutation = usePublishProject({
    mutation: {
      onSuccess: () => {
        toast.success("Project published");
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      }
    }
  });

  const unpublishMutation = useUnpublishProject({
    mutation: {
      onSuccess: () => {
        toast.success("Project unpublished");
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      }
    }
  });

  const toggleFeaturedMutation = useToggleProjectFeatured({
    mutation: {
      onSuccess: () => {
        toast.success("Project featured status updated");
        queryClient.invalidateQueries({ queryKey: getListProjectsQueryKey() });
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
          <p className="text-muted-foreground mt-1">Manage all illustrations and packs.</p>
        </div>
        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Input 
          placeholder="Search projects..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="border rounded-md overflow-x-auto">
        <Table className="min-w-[640px]">
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Stats</TableHead>
              <TableHead className="text-right">Updated</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-12 w-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-8" /></TableCell>
                </TableRow>
              ))
            ) : data?.projects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No projects found.
                </TableCell>
              </TableRow>
            ) : (
              data?.projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-muted rounded flex items-center justify-center overflow-hidden shrink-0">
                        {project.coverImage ? (
                          <img src={project.coverImage} alt={project.title} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium flex items-center gap-2">
                          {project.title}
                          {project.featured && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />}
                        </span>
                        <span className="text-xs text-muted-foreground">{project.slug}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={project.status === 'published' ? 'default' : 'secondary'} className="capitalize">
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {project.categoryName || <span className="text-muted-foreground italic">None</span>}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    <div>{project.viewCount} views</div>
                    <div>{project.assetCount} assets</div>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {format(new Date(project.updatedAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}/edit`} className="cursor-pointer w-full flex items-center">
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {project.status === 'published' ? (
                          <DropdownMenuItem onClick={() => unpublishMutation.mutate({ id: project.id })}>
                            <EyeOff className="mr-2 h-4 w-4" /> Unpublish
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => publishMutation.mutate({ id: project.id })}>
                            <Eye className="mr-2 h-4 w-4" /> Publish
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => toggleFeaturedMutation.mutate({ id: project.id })}>
                          <Star className="mr-2 h-4 w-4" /> Toggle Featured
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteId(project.id)}
                        >
                          <Trash className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all its assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

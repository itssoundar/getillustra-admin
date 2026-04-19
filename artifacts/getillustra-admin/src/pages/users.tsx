import { useState } from "react";
import { useListUsers, useUpdateUserRole, getListUsersQueryKey } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, ShieldCheck, UserCog, UserX } from "lucide-react";
import { format } from "date-fns";

const roleColors: Record<string, string> = {
  admin: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  editor: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  user: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const params = { search: search || undefined };
  const { data: users = [], isLoading } = useListUsers(params, { query: { queryKey: getListUsersQueryKey(params) } });

  const updateRole = useUpdateUserRole({
    mutation: {
      onSuccess: () => { toast.success("Role updated"); queryClient.invalidateQueries({ queryKey: getListUsersQueryKey(params) }); },
      onError: () => toast.error("Failed to update role"),
    },
  });

  const handleRoleChange = (id: string, role: "admin" | "editor" | "user") => {
    updateRole.mutate({ id, data: { role } });
  };

  return (
    <div className="space-y-6" data-testid="users-page">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Users</h1><p className="text-sm text-muted-foreground mt-1">{users.length} users</p></div>
      </div>
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input data-testid="search-users" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>
      <div className="border rounded-lg overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[580px]">
          <thead className="bg-muted/30 border-b"><tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">User</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Email</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Joined</th>
            <th className="w-10 px-4 py-3" />
          </tr></thead>
          <tbody className="divide-y">
            {isLoading ? Array.from({ length: 6 }).map((_, i) => (<tr key={i}><td colSpan={5} className="px-4 py-3"><Skeleton className="h-10 w-full" /></td></tr>)) :
            users.length === 0 ? (<tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground text-sm">No users found</td></tr>) :
            users.map((user) => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors" data-testid={`user-row-${user.id}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl ?? undefined} />
                      <AvatarFallback className="text-xs">{(user.fullName ?? user.email).slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.fullName ?? "Anonymous"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleColors[user.role] ?? roleColors.user}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(user.createdAt), "MMM d, yyyy")}</td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, "admin")}><ShieldCheck className="h-4 w-4 mr-2" />Make Admin</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, "editor")}><UserCog className="h-4 w-4 mr-2" />Make Editor</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleRoleChange(user.id, "user")} className="text-muted-foreground"><UserX className="h-4 w-4 mr-2" />Remove Access</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

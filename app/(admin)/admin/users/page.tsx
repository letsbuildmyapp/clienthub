"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, MoreVertical, Search } from "lucide-react";
import { useDb } from "@/lib/data/hooks";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { changeMemberRole, impersonate } from "@/lib/data/api";
import { timeAgo } from "@/lib/utils";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const db = useDb();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const users = useMemo(
    () =>
      Object.values(db.users).sort((a, b) =>
        a.role === b.role ? a.name.localeCompare(b.name) : a.role === "admin" ? -1 : a.role === "owner" ? -1 : 1,
      ),
    [db.users],
  );

  const filtered = query
    ? users.filter(
        (u) =>
          u.name.toLowerCase().includes(query.toLowerCase()) ||
          u.email.toLowerCase().includes(query.toLowerCase()),
      )
    : users;

  return (
    <div className="container mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="All users"
        description={`${users.length} users across ${Object.keys(db.teams).length} teams`}
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search users…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{filtered.length} of {users.length}</div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">User</th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Team</th>
                  <th className="px-3 py-2 text-left font-medium">Role</th>
                  <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Joined</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((u) => {
                  const team = u.primaryTeamId ? db.teams[u.primaryTeamId] : null;
                  return (
                    <tr key={u.id} className="hover:bg-accent/30">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={u.name} color={u.avatarColor} />
                          <div className="min-w-0">
                            <div className="font-medium">{u.name}</div>
                            <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="hidden px-3 py-2.5 text-sm md:table-cell">{team?.name ?? "—"}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={u.role === "admin" ? "default" : u.role === "owner" ? "default" : "secondary"} className="capitalize">
                          {u.role}
                        </Badge>
                      </td>
                      <td className="hidden px-3 py-2.5 text-xs text-muted-foreground sm:table-cell">{timeAgo(u.joinedAt)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="hidden h-7 sm:inline-flex"
                            onClick={() => {
                              impersonate(u.id);
                              toast.success(`Now viewing as ${u.name}`);
                              router.push(u.role === "admin" ? "/admin" : "/dashboard");
                            }}
                            disabled={u.role === "admin"}
                          >
                            <Eye className="h-3.5 w-3.5" /> Impersonate
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                                <MoreVertical className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="sm:hidden"
                                onClick={() => {
                                  impersonate(u.id);
                                  toast.success(`Now viewing as ${u.name}`);
                                  router.push(u.role === "admin" ? "/admin" : "/dashboard");
                                }}
                                disabled={u.role === "admin"}
                              >
                                <Eye /> Impersonate
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  changeMemberRole(u.id, u.role === "owner" ? "member" : "owner");
                                  toast.success("Role updated");
                                }}
                                disabled={u.role === "admin"}
                              >
                                {u.role === "owner" ? "Demote to Member" : "Promote to Owner"}
                              </DropdownMenuItem>
                              <DropdownMenuItem disabled>Send password reset</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

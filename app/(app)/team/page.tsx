"use client";

import { useMemo, useState } from "react";
import { MoreVertical, Plus, Search, Trash2, UserPlus } from "lucide-react";
import { useDb } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeMemberRole, inviteMember, removeMember } from "@/lib/data/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { cn, timeAgo } from "@/lib/utils";
import type { Role, User } from "@/lib/types";

export default function TeamPage() {
  const db = useDb();
  const { user, activeTeam } = useAuth();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [memberToRemove, setMemberToRemove] = useState<User | null>(null);

  if (!user || !activeTeam) return null;

  const members = useMemo(
    () =>
      Object.values(db.users)
        .filter((u) => u.teamIds.includes(activeTeam.id))
        .sort((a, b) =>
          a.role === b.role ? a.name.localeCompare(b.name) : a.role === "owner" ? -1 : 1,
        ),
    [db.users, activeTeam.id],
  );

  const filtered = query
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(query.toLowerCase()) ||
          m.email.toLowerCase().includes(query.toLowerCase()),
      )
    : members;

  const canManage = user.role === "owner" || user.role === "admin";

  function onInvite(e: React.FormEvent) {
    e.preventDefault();
    inviteMember(activeTeam!.id, email, name || email.split("@")[0], title || "Team member", role);
    toast.success(`Invitation sent to ${email}`);
    setName("");
    setEmail("");
    setTitle("");
    setRole("member");
    setOpen(false);
  }

  return (
    <div className="container mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title={`${activeTeam.name} team`}
        description={`${members.length} member${members.length === 1 ? "" : "s"} · ${activeTeam.industry}`}
        actions={
          canManage && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4" /> Invite member
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                  <DialogTitle>Invite a team member</DialogTitle>
                  <DialogDescription>They&apos;ll receive an email invitation to join {activeTeam.name}.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onInvite} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="iname">Full name</Label>
                      <Input id="iname" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ititle">Job title</Label>
                      <Input id="ititle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Senior Designer" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="iemail">Email</Label>
                    <Input id="iemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jordan@company.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="irole">Role</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                      <SelectTrigger id="irole"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Send invite</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )
        }
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search members…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
              {filtered.length} of {members.length}
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Member</th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Title</th>
                  <th className="px-3 py-2 text-left font-medium">Role</th>
                  <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Joined</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((m) => (
                  <tr key={m.id} className="hover:bg-accent/30">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <UserAvatar name={m.name} color={m.avatarColor} />
                        <div className="min-w-0">
                          <div className="font-medium">{m.name}</div>
                          <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-2.5 md:table-cell">{m.title}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={m.role === "owner" ? "default" : "secondary"} className="capitalize">
                        {m.role}
                      </Badge>
                      {m.status === "invited" && (
                        <Badge variant="outline" className="ml-2 text-amber-600 dark:text-amber-400">Pending</Badge>
                      )}
                    </td>
                    <td className="hidden px-3 py-2.5 text-xs text-muted-foreground sm:table-cell">{timeAgo(m.joinedAt)}</td>
                    <td className="px-3 py-2.5 text-right">
                      {canManage && m.id !== user.id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                changeMemberRole(m.id, m.role === "owner" ? "member" : "owner");
                                toast.success(`${m.name} role updated`);
                              }}
                            >
                              {m.role === "owner" ? "Demote to Member" : "Promote to Owner"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                setMemberToRemove(m);
                              }}
                            >
                              <Trash2 /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-12 text-center text-sm text-muted-foreground">
                      No members match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={memberToRemove !== null}
        onOpenChange={(v) => { if (!v) setMemberToRemove(null); }}
        title={`Remove ${memberToRemove?.name ?? "this member"}?`}
        description={`They'll lose access to ${activeTeam.name} and all of its projects, tickets, and files. This can't be undone.`}
        confirmLabel="Remove member"
        destructive
        onConfirm={() => {
          if (!memberToRemove) return;
          const removed = memberToRemove;
          removeMember(activeTeam.id, removed.id);
          toast.success(`${removed.name} was removed from the team.`);
          setMemberToRemove(null);
        }}
      />
    </div>
  );
}

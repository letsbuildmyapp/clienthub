"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LifeBuoy, Plus, Search } from "lucide-react";
import { useDb } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, timeAgo } from "@/lib/utils";
import type { Ticket } from "@/lib/types";
import { updateTicket } from "@/lib/data/api";
import { NewTicketDialog } from "@/components/dashboard/new-ticket-dialog";
import { toast } from "sonner";

const STATUS_STYLES: Record<Ticket["status"], string> = {
  open: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  in_progress: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  waiting: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  resolved: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  closed: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};
const PRIORITY_DOTS: Record<Ticket["priority"], string> = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-amber-500",
  urgent: "bg-rose-500",
};

export default function TicketsPage() {
  const db = useDb();
  const { user, activeTeam } = useAuth();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [newOpen, setNewOpen] = useState(false);

  if (!user || !activeTeam) return null;

  const all = Object.values(db.tickets)
    .filter((t) => t.teamId === activeTeam.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const filtered = useMemo(() => {
    let list = all;
    if (tab === "open") list = list.filter((t) => t.status === "open" || t.status === "in_progress");
    else if (tab === "resolved") list = list.filter((t) => t.status === "resolved" || t.status === "closed");
    if (query) list = list.filter((t) => t.subject.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [all, tab, query]);

  const stats = {
    open: all.filter((t) => t.status === "open").length,
    inProgress: all.filter((t) => t.status === "in_progress").length,
    resolvedThisWeek: all.filter((t) => {
      const ts = new Date(t.updatedAt).getTime();
      return t.status === "resolved" && ts > Date.now() - 7 * 24 * 60 * 60 * 1000;
    }).length,
  };

  return (
    <div className="container mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Support tickets"
        description="Issues raised by your team or customers, all in one place."
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" /> New ticket
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatPill label="Open" value={stats.open} accent="bg-blue-500" />
        <StatPill label="In progress" value={stats.inProgress} accent="bg-amber-500" />
        <StatPill label="Resolved this week" value={stats.resolvedThisWeek} accent="bg-emerald-500" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">All <span className="ml-1.5 text-muted-foreground">({all.length})</span></TabsTrigger>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search by subject…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Ticket</th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Requester</th>
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Assignee</th>
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="hidden px-3 py-2 text-left font-medium sm:table-cell">Updated</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => {
                  const requester = db.users[t.requesterId];
                  const assignee = t.assigneeId ? db.users[t.assigneeId] : null;
                  return (
                    <tr key={t.id} className="hover:bg-accent/30">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOTS[t.priority])} />
                          <span className="font-mono text-[11px] text-muted-foreground">#{t.number}</span>
                          <span className="font-medium">{t.subject}</span>
                        </div>
                      </td>
                      <td className="hidden px-3 py-2.5 md:table-cell">
                        {requester && (
                          <div className="flex items-center gap-2">
                            <UserAvatar name={requester.name} color={requester.avatarColor} className="h-6 w-6" />
                            <span className="text-xs">{requester.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="hidden px-3 py-2.5 md:table-cell">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <UserAvatar name={assignee.name} color={assignee.avatarColor} className="h-6 w-6" />
                            <span className="text-xs">{assignee.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Unassigned</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Select
                          value={t.status}
                          onValueChange={(v) => {
                            updateTicket(t.id, { status: v as Ticket["status"] });
                            if (v === "resolved") toast.success(`#${t.number} marked resolved`);
                          }}
                        >
                          <SelectTrigger className="h-7 w-[140px] border-0 bg-transparent px-2 text-xs">
                            <Badge variant="outline" className={cn("h-5 capitalize", STATUS_STYLES[t.status])}>
                              {t.status.replace("_", " ")}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In progress</SelectItem>
                            <SelectItem value="waiting">Waiting</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="hidden px-3 py-2.5 text-xs text-muted-foreground sm:table-cell">{timeAgo(t.updatedAt)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                          <span className="sr-only">Open</span>
                          <Search className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-3 py-12 text-center">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <LifeBuoy className="h-6 w-6" />
                        <span className="text-sm">No tickets match your filters.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <NewTicketDialog open={newOpen} onOpenChange={setNewOpen} teamId={activeTeam.id} />
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <div className={cn("h-8 w-1 rounded-full", accent)} />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

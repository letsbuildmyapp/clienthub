"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, Search } from "lucide-react";
import { useDb } from "@/lib/data/hooks";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TeamLogo } from "@/components/shared/team-logo";
import { Switch } from "@/components/ui/switch";
import { suspendTeam } from "@/lib/data/api";
import { planById } from "@/lib/plans";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";
import { toast } from "sonner";

type SortKey = "name" | "mrr" | "members" | "created";

export default function AdminTeamsPage() {
  const db = useDb();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("mrr");
  const [dir, setDir] = useState<"asc" | "desc">("desc");

  const teams = Object.values(db.teams);
  const memberCounts = useMemo(() => {
    const m: Record<string, number> = {};
    Object.values(db.users).forEach((u) => {
      u.teamIds.forEach((tid) => {
        m[tid] = (m[tid] ?? 0) + 1;
      });
    });
    return m;
  }, [db.users]);

  const filtered = useMemo(() => {
    let list = teams;
    if (query) list = list.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));
    list.sort((a, b) => {
      const dirMul = dir === "asc" ? 1 : -1;
      switch (sort) {
        case "name": return a.name.localeCompare(b.name) * dirMul;
        case "mrr": return (a.mrrCents - b.mrrCents) * dirMul;
        case "members": return ((memberCounts[a.id] ?? 0) - (memberCounts[b.id] ?? 0)) * dirMul;
        case "created": return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dirMul;
      }
    });
    return list;
  }, [teams, query, sort, dir, memberCounts]);

  function toggleSort(key: SortKey) {
    if (sort === key) setDir(dir === "asc" ? "desc" : "asc");
    else { setSort(key); setDir("desc"); }
  }

  return (
    <div className="container mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="All teams"
        description={`${teams.length} teams on the platform`}
      />

      <Card>
        <CardContent className="p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search teams…" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <div className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">{filtered.length} of {teams.length}</div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <SortHeader label="Team" k="name" cur={sort} dir={dir} onClick={toggleSort} />
                  <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Plan</th>
                  <SortHeader label="MRR" k="mrr" cur={sort} dir={dir} onClick={toggleSort} className="text-right" />
                  <SortHeader label="Members" k="members" cur={sort} dir={dir} onClick={toggleSort} className="text-right hidden sm:table-cell" />
                  <SortHeader label="Created" k="created" cur={sort} dir={dir} onClick={toggleSort} className="hidden md:table-cell" />
                  <th className="px-3 py-2 text-left font-medium">Status</th>
                  <th className="hidden px-3 py-2 sm:table-cell"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t) => {
                  const memberCount = memberCounts[t.id] ?? 0;
                  return (
                    <tr key={t.id} className="hover:bg-accent/30">
                      <td className="px-3 py-2.5">
                        <Link href={`/admin/teams/${t.id}`} className="flex items-center gap-3 font-medium hover:underline">
                          <TeamLogo name={t.name} color={t.logoColor} />
                          <div className="min-w-0">
                            <div className="truncate">{t.name}</div>
                            <div className="text-[11px] text-muted-foreground">{t.industry}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden px-3 py-2.5 md:table-cell">
                        <Badge variant="outline" className="capitalize">{planById(t.plan).name}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium tabular-nums">{formatCurrency(t.mrrCents)}</td>
                      <td className="hidden px-3 py-2.5 text-right tabular-nums sm:table-cell">{memberCount}</td>
                      <td className="hidden px-3 py-2.5 text-xs text-muted-foreground md:table-cell">{timeAgo(t.createdAt)}</td>
                      <td className="px-3 py-2.5">
                        {t.suspended ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="hidden px-3 py-2.5 text-right sm:table-cell">
                        <div className="flex items-center justify-end gap-2">
                          <Switch
                            checked={!t.suspended}
                            onCheckedChange={(on) => {
                              suspendTeam(t.id, !on);
                              toast.success(on ? `${t.name} reactivated` : `${t.name} suspended`);
                            }}
                          />
                          <Button asChild variant="ghost" size="sm" className="h-7">
                            <Link href={`/admin/teams/${t.id}`}>View</Link>
                          </Button>
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

function SortHeader({
  label, k, cur, dir, onClick, className,
}: {
  label: string; k: SortKey; cur: SortKey; dir: "asc" | "desc";
  onClick: (k: SortKey) => void; className?: string;
}) {
  return (
    <th className={cn("px-3 py-2 text-left font-medium", className)}>
      <button onClick={() => onClick(k)} className="inline-flex items-center gap-1 hover:text-foreground">
        {label}
        <ArrowUpDown className={cn("h-3 w-3", cur === k ? "text-foreground" : "text-muted-foreground/50")} />
      </button>
    </th>
  );
}

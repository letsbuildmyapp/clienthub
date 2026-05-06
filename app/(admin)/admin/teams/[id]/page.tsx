"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CreditCard, Users } from "lucide-react";
import { useDb } from "@/lib/data/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TeamLogo } from "@/components/shared/team-logo";
import { UserAvatar } from "@/components/shared/user-avatar";
import { suspendTeam } from "@/lib/data/api";
import { cn, formatCurrency, timeAgo } from "@/lib/utils";
import { planById } from "@/lib/plans";
import { toast } from "sonner";

export default function AdminTeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const db = useDb();
  const team = db.teams[id];
  if (!team) {
    return (
      <div className="container mx-auto max-w-3xl p-6 text-center text-sm text-muted-foreground">
        Team not found.
      </div>
    );
  }
  const members = Object.values(db.users).filter((u) => u.teamIds.includes(id));
  const invoices = Object.values(db.invoices).filter((i) => i.teamId === id);
  const lifetime = invoices.reduce((s, i) => (i.status === "paid" ? s + i.amountCents : s), 0);

  return (
    <div className="container mx-auto max-w-[1200px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button asChild variant="ghost" size="sm" className="h-7 px-2">
          <Link href="/admin/teams"><ArrowLeft className="h-3.5 w-3.5" /> All teams</Link>
        </Button>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
        <TeamLogo name={team.name} color={team.logoColor} className="h-14 w-14 text-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">{team.name}</h1>
            {team.suspended ? (
              <Badge variant="destructive">Suspended</Badge>
            ) : (
              <Badge variant="success">Active</Badge>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            {team.industry} · Created {new Date(team.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs text-muted-foreground">Suspended</div>
          <Switch
            checked={team.suspended}
            onCheckedChange={(on) => {
              suspendTeam(team.id, on);
              toast.success(on ? `${team.name} suspended` : `${team.name} reactivated`);
            }}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" /> Current plan
            </div>
            <div className="mt-2 text-2xl font-semibold capitalize">{planById(team.plan).name}</div>
            <div className="mt-1 text-xs text-muted-foreground">{formatCurrency(team.mrrCents)} / month</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> Members
            </div>
            <div className="mt-2 text-2xl font-semibold">{members.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">{members.filter((m) => m.role === "owner").length} owner</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <CreditCard className="h-3.5 w-3.5" /> Lifetime revenue
            </div>
            <div className="mt-2 text-2xl font-semibold">{formatCurrency(lifetime)}</div>
            <div className="mt-1 text-xs text-muted-foreground">{invoices.length} invoices</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="divide-y divide-border">
            {members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-6 py-2.5">
                <UserAvatar name={m.name} color={m.avatarColor} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{m.name}</div>
                  <div className="truncate text-xs text-muted-foreground">{m.email}</div>
                </div>
                <Badge variant={m.role === "owner" ? "default" : "secondary"} className="capitalize">{m.role}</Badge>
                <div className="hidden text-xs text-muted-foreground sm:block">{timeAgo(m.joinedAt)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

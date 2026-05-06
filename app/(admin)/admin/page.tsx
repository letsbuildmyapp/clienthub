"use client";

import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Building2,
  Clock,
  CreditCard,
  Database,
  Server,
  TrendingUp,
  UserPlus,
  Users,
  Wifi,
} from "lucide-react";
import { useDb } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { TeamLogo } from "@/components/shared/team-logo";
import { planById } from "@/lib/plans";
import { cn, formatCurrency, formatNumber, timeAgo } from "@/lib/utils";

export default function AdminOverviewPage() {
  const db = useDb();
  const { user } = useAuth();
  if (!user || user.role !== "admin") return null;

  const teams = Object.values(db.teams);
  const users = Object.values(db.users).filter((u) => u.role !== "admin");
  const mrr = teams.reduce((s, t) => s + t.mrrCents, 0);
  const newSignups = teams.filter((t) => {
    const ms = Date.now() - new Date(t.createdAt).getTime();
    return ms < 30 * 86400_000;
  }).length;
  const activeUsers = users.filter((u) => u.status === "active").length;

  const recentActivity = Object.values(db.activity)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  return (
    <div className="container mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Platform overview"
        description="Real-time health and activity across every team on ClientHub."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStat label="Total teams" value={String(teams.length)} delta={`+${newSignups} this month`} icon={Building2} />
        <AdminStat label="Total users" value={formatNumber(activeUsers)} delta="+12.4% MoM" icon={Users} />
        <AdminStat label="Platform MRR" value={formatCurrency(mrr)} delta="+8.1% MoM" icon={CreditCard} accent />
        <AdminStat label="Signups (30d)" value={String(newSignups)} delta="trending up" icon={UserPlus} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <ActivityChart data={db.globalMetrics} />

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle>Top teams by MRR</CardTitle>
              <Link href="/admin/teams" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-0 pb-2">
              <div className="divide-y divide-border">
                {teams
                  .sort((a, b) => b.mrrCents - a.mrrCents)
                  .slice(0, 5)
                  .map((t) => {
                    const memberCount = Object.values(db.users).filter((u) => u.teamIds.includes(t.id)).length;
                    return (
                      <Link
                        key={t.id}
                        href={`/admin/teams/${t.id}`}
                        className="flex items-center gap-3 px-6 py-2.5 transition-colors hover:bg-accent/40"
                      >
                        <TeamLogo name={t.name} color={t.logoColor} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{t.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {t.industry} · {memberCount} member{memberCount === 1 ? "" : "s"}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">{planById(t.plan).name}</Badge>
                        <div className="w-20 text-right font-medium tabular-nums">{formatCurrency(t.mrrCents)}</div>
                      </Link>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <SystemHealthCard />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-muted-foreground" /> Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="space-y-3">
                {recentActivity.map((e) => {
                  const actor = db.users[e.actorId];
                  const team = db.teams[e.teamId];
                  return (
                    <div key={e.id} className="flex items-start gap-2 text-xs">
                      <Clock className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <span className="font-medium">{actor?.name ?? "System"}</span>
                        <span className="text-muted-foreground">{e.message}</span>
                        <span className="text-muted-foreground"> · {team?.name}</span>
                        <div className="text-[11px] text-muted-foreground/80">{timeAgo(e.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdminStat({
  label,
  value,
  delta,
  icon: Icon,
  accent = false,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
  accent?: boolean;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {label}
        </div>
        {accent && (
          <Badge variant="success" className="h-5 px-1.5 text-[10px]">
            <TrendingUp className="h-3 w-3" />
          </Badge>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{delta}</div>
    </Card>
  );
}

function SystemHealthCard() {
  const checks = [
    { label: "API uptime", value: "99.98%", icon: Server },
    { label: "API p95 latency", value: "142ms", icon: Wifi },
    { label: "Database", value: "Healthy", icon: Database },
  ];
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">System health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-3 py-2">
            <div className="flex items-center gap-2 text-sm">
              <c.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {c.label}
            </div>
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <span className={cn("h-1.5 w-1.5 rounded-full bg-success")} />
              {c.value}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, CheckCircle2, DollarSign, LifeBuoy, Users } from "lucide-react";
import { useDb } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/context";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { NewTaskDialog } from "@/components/dashboard/new-task-dialog";
import { TicketsPanel } from "@/components/dashboard/tickets-panel";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { planById } from "@/lib/plans";
import type { TaskStatus } from "@/lib/types";

export default function DashboardPage() {
  const db = useDb();
  const { user, activeTeam } = useAuth();
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskDefaultStatus, setTaskDefaultStatus] = useState<TaskStatus>("todo");

  if (!user) return null;

  const isAdmin = user.role === "admin";
  const teamId = activeTeam?.id;

  const tasks = isAdmin
    ? Object.values(db.tasks)
    : Object.values(db.tasks).filter((t) => t.teamId === teamId);
  const tickets = isAdmin
    ? Object.values(db.tickets)
    : Object.values(db.tickets).filter((t) => t.teamId === teamId);
  const activity = isAdmin
    ? Object.values(db.activity)
    : Object.values(db.activity).filter((a) => a.teamId === teamId);

  const metrics = isAdmin
    ? db.globalMetrics
    : (teamId && db.metrics[teamId]) || [];

  // Top stats
  const totalUsers = isAdmin
    ? Object.values(db.users).filter((u) => u.role !== "admin").length
    : (activeTeam ? Object.values(db.users).filter((u) => u.teamIds.includes(activeTeam.id)).length : 0);
  const mrr = isAdmin
    ? Object.values(db.teams).reduce((s, t) => s + t.mrrCents, 0)
    : activeTeam?.mrrCents ?? 0;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const totalTasks = tasks.length || 1;
  const completionPct = Math.round((completedTasks / totalTasks) * 100);
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  // Build sparkline arrays from metrics with sensible variants
  const usersSpark = metrics.map((m) => m.activeUsers);
  const tasksSpark = metrics.map((m) => m.tasksCompleted);
  const ticketsSpark = metrics.map((m) => m.ticketsResolved);
  const mrrSpark = metrics.map((_, i) => mrr / 100 * (0.9 + i / metrics.length / 10));

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div className="container mx-auto max-w-[1400px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title={
          <>
            {greeting}, <span className="text-gradient">{user.name.split(" ")[0]}</span>
          </>
        }
        description={
          isAdmin
            ? "Platform-wide health and recent activity across every team."
            : `Here's what's happening at ${activeTeam?.name ?? "your team"}.`
        }
        actions={
          !isAdmin && (
            <Button asChild>
              <Link href="/projects">View board <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={isAdmin ? "Platform MRR" : "Monthly recurring"}
          value={formatCurrency(mrr)}
          delta={12.4}
          series={mrrSpark}
          icon={DollarSign}
          accent="emerald"
        />
        <StatCard
          label="Active users"
          value={formatNumber(totalUsers)}
          delta={8.2}
          series={usersSpark}
          icon={Users}
          accent="primary"
        />
        <StatCard
          label="Project completion"
          value={`${completionPct}%`}
          delta={4.8}
          series={tasksSpark}
          icon={CheckCircle2}
          accent="amber"
        />
        <StatCard
          label="Open tickets"
          value={String(openTickets)}
          delta={-3.1}
          series={ticketsSpark}
          icon={LifeBuoy}
          accent="rose"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <ActivityChart data={metrics} />

          {!isAdmin && (
            <Card>
              <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
                <div>
                  <CardTitle>Project board</CardTitle>
                  <p className="text-xs text-muted-foreground">A snapshot of your team&apos;s active work</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/projects">Open board <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </CardHeader>
              <CardContent>
                <KanbanBoard
                  tasks={tasks}
                  users={db.users}
                  compact
                  onCreate={(s) => {
                    setTaskDefaultStatus(s);
                    setTaskDialogOpen(true);
                  }}
                />
              </CardContent>
            </Card>
          )}

          <TicketsPanel tickets={tickets} />
        </div>

        <div className="space-y-4">
          {!isAdmin && activeTeam && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Plan & usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Current plan</span>
                  <span className="font-medium">{planById(activeTeam.plan).name}</span>
                </div>
                <UsageRow label="Seats" value={activeTeam.seatsUsed} max={planById(activeTeam.plan).limits.seats} />
                <UsageRow label="Storage" value={activeTeam.storageUsedGb} max={planById(activeTeam.plan).limits.storageGb} unit="GB" />
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/billing">Manage billing</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <ActivityFeed events={activity} users={db.users} />
        </div>
      </div>

      {activeTeam && (
        <NewTaskDialog
          open={taskDialogOpen}
          onOpenChange={setTaskDialogOpen}
          teamId={activeTeam.id}
          defaultStatus={taskDefaultStatus}
        />
      )}
    </div>
  );
}

function UsageRow({ label, value, max, unit }: { label: string; value: number; max: number; unit?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {value}{unit ? ` ${unit}` : ""} <span className="text-muted-foreground">/ {max}{unit ? ` ${unit}` : ""}</span>
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Ticket, User } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

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

export function TicketsPanel({ tickets }: { tickets: Ticket[] }) {
  const recent = [...tickets]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Recent tickets</CardTitle>
          <p className="text-xs text-muted-foreground">Latest activity</p>
        </div>
        <Link
          href="/tickets"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="px-0 pb-2">
        {recent.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No tickets yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recent.map((t) => (
              <Link
                key={t.id}
                href="/tickets"
                className="flex items-center gap-3 px-6 py-2.5 transition-colors hover:bg-accent/40"
              >
                <span
                  className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOTS[t.priority])}
                  title={`${t.priority} priority`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-muted-foreground">#{t.number}</span>
                    <span className="truncate text-sm font-medium">{t.subject}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    Updated {timeAgo(t.updatedAt)}
                  </div>
                </div>
                <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px] font-medium capitalize", STATUS_STYLES[t.status])}>
                  {t.status.replace("_", " ")}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

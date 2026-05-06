"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DailyMetric } from "@/lib/types";
import { useState } from "react";
import { cn } from "@/lib/utils";

type Series = "activeUsers" | "tasksCompleted" | "ticketsResolved";
const SERIES: { key: Series; label: string; color: string }[] = [
  { key: "activeUsers", label: "Active users", color: "hsl(var(--chart-1))" },
  { key: "tasksCompleted", label: "Tasks completed", color: "hsl(var(--chart-2))" },
  { key: "ticketsResolved", label: "Tickets resolved", color: "hsl(var(--chart-3))" },
];

export function ActivityChart({ data }: { data: DailyMetric[] }) {
  const [enabled, setEnabled] = useState<Record<Series, boolean>>({
    activeUsers: true,
    tasksCompleted: true,
    ticketsResolved: true,
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle>Activity</CardTitle>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
        <div className="flex items-center gap-1">
          {SERIES.map((s) => {
            const on = enabled[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setEnabled((e) => ({ ...e, [s.key]: !e[s.key] }))}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                  on
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent/60",
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: on ? s.color : "hsl(var(--muted-foreground))" }}
                />
                {s.label}
              </button>
            );
          })}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <defs>
                {SERIES.map((s) => (
                  <linearGradient key={s.key} id={`area-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="hsl(var(--border) / 0.5)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => {
                  const date = new Date(d);
                  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
                tickLine={false}
                axisLine={false}
                interval={4}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                  boxShadow: "0 8px 24px hsl(0 0% 0% / 0.12)",
                }}
                labelFormatter={(d: string) =>
                  new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                }
              />
              {SERIES.map(
                (s) =>
                  enabled[s.key] && (
                    <Area
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      stroke={s.color}
                      strokeWidth={2}
                      fill={`url(#area-${s.key})`}
                      isAnimationActive={false}
                      name={s.label}
                    />
                  ),
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

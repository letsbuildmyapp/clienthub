"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type StatCardProps = {
  label: string;
  value: string;
  delta: number;
  deltaSuffix?: string;
  series: number[];
  icon?: React.ComponentType<{ className?: string }>;
  accent?: "primary" | "emerald" | "amber" | "rose";
};

const ACCENT_MAP = {
  primary: { stroke: "hsl(var(--primary))", grad: ["hsl(var(--primary) / 0.35)", "hsl(var(--primary) / 0)"] },
  emerald: { stroke: "hsl(142 71% 45%)", grad: ["hsl(142 71% 45% / 0.35)", "hsl(142 71% 45% / 0)"] },
  amber: { stroke: "hsl(38 92% 50%)", grad: ["hsl(38 92% 50% / 0.35)", "hsl(38 92% 50% / 0)"] },
  rose: { stroke: "hsl(346 80% 58%)", grad: ["hsl(346 80% 58% / 0.35)", "hsl(346 80% 58% / 0)"] },
};

export function StatCard({
  label,
  value,
  delta,
  deltaSuffix = "%",
  series,
  icon: Icon,
  accent = "primary",
}: StatCardProps) {
  const positive = delta >= 0;
  const accentCfg = ACCENT_MAP[accent];
  const data = series.map((v, i) => ({ i, v }));
  const id = `grad-${label.replace(/\W/g, "")}`;

  return (
    <Card className="group relative overflow-hidden p-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            <span>{label}</span>
          </div>
          <div className="text-2xl font-semibold tracking-tight tabular-nums">{value}</div>
          <div
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium",
              positive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive",
            )}
          >
            {positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
            {Math.abs(delta).toFixed(1)}{deltaSuffix}
            <span className="ml-0.5 font-normal text-muted-foreground">vs last 30d</span>
          </div>
        </div>
      </div>
      <div className="absolute bottom-0 right-0 h-16 w-3/5 opacity-90">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentCfg.grad[0]} />
                <stop offset="100%" stopColor={accentCfg.grad[1]} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={accentCfg.stroke}
              strokeWidth={1.5}
              fill={`url(#${id})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TeamLogo } from "@/components/shared/team-logo";
import { setActiveTeam } from "@/lib/data/api";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { planById } from "@/lib/plans";

export function TeamSwitcher({ onAfterSelect }: { onAfterSelect?: () => void }) {
  const { activeTeam, teams } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  if (!activeTeam) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex w-full items-center gap-2 rounded-lg border border-border bg-background/40 px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent/60"
        >
          <TeamLogo name={activeTeam.name} color={activeTeam.logoColor} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{activeTeam.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{planById(activeTeam.plan).name} plan</div>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1">
        <div className="px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Teams
        </div>
        {teams.map((t) => {
          const active = t.id === activeTeam.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTeam(t.id);
                setOpen(false);
                const isMobile =
                  typeof window !== "undefined" &&
                  window.matchMedia("(max-width: 767px)").matches;
                if (isMobile) {
                  onAfterSelect?.();
                  router.push("/dashboard");
                }
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
                active ? "bg-accent" : "hover:bg-accent/60",
              )}
            >
              <TeamLogo name={t.name} color={t.logoColor} className="h-6 w-6" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{t.name}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {planById(t.plan).name}
                </div>
              </div>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          );
        })}
        <div className="my-1 h-px bg-border" />
        <button className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground">
          <Plus className="h-3.5 w-3.5" /> Add a team
        </button>
      </PopoverContent>
    </Popover>
  );
}

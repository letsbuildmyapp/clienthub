"use client";

import { Activity, MessageSquare, MoveRight, Plus, Receipt, ShieldCheck, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { ActivityEvent, User } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

const ICONS: Record<ActivityEvent["type"], React.ComponentType<{ className?: string }>> = {
  task_moved: MoveRight,
  task_created: Plus,
  comment_added: MessageSquare,
  invoice_paid: Receipt,
  member_invited: UserPlus,
  plan_upgraded: ShieldCheck,
  ticket_resolved: ShieldCheck,
  ticket_assigned: Activity,
};

export function ActivityFeed({
  events,
  users,
}: {
  events: ActivityEvent[];
  users: Record<string, User>;
}) {
  const recent = [...events]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <div className="relative space-y-3">
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
          {recent.map((e) => {
            const actor = users[e.actorId];
            const Icon = ICONS[e.type];
            return (
              <div key={e.id} className="relative flex items-start gap-3 pl-0">
                <div className="relative z-10">
                  {actor ? (
                    <UserAvatar
                      name={actor.name}
                      color={actor.avatarColor}
                      className="h-7 w-7 ring-2 ring-card"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted">
                      <Icon className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="text-xs leading-snug">
                    <span className="font-medium">{actor?.name ?? "System"}</span>
                    <span className="text-muted-foreground">{e.message}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground/80">{timeAgo(e.createdAt)}</div>
                </div>
              </div>
            );
          })}
          {recent.length === 0 && (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No recent activity.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

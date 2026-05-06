"use client";

import Link from "next/link";
import { Bell, Check, CreditCard, Inbox, MessageSquare, ShieldAlert, UsersIcon } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { useDb } from "@/lib/data/hooks";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/data/api";
import type { AppNotification, NotificationType } from "@/lib/types";
import { cn, timeAgo } from "@/lib/utils";

const TYPE_ICONS: Record<NotificationType, React.ComponentType<{ className?: string }>> = {
  mention: MessageSquare,
  billing: CreditCard,
  system: ShieldAlert,
  task: Inbox,
  ticket: Inbox,
  team: UsersIcon,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  mention: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  billing: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  system: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  task: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  ticket: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  team: "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
};

export function NotificationsBell() {
  const { user } = useAuth();
  const db = useDb();
  if (!user) return null;
  const items = Object.values(db.notifications)
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const unread = items.filter((n) => !n.read).length;
  const recent = items.slice(0, 7);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-muted-foreground">{unread} unread</div>
          </div>
          {unread > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={(e) => {
                markAllNotificationsRead(user.id);
                (e.currentTarget as HTMLButtonElement).blur();
              }}
            >
              <Check className="h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <Inbox className="h-8 w-8 text-muted-foreground" />
              <div className="text-sm font-medium">You&apos;re all caught up</div>
              <div className="text-xs text-muted-foreground">New activity will appear here.</div>
            </div>
          ) : (
            recent.map((n) => <NotificationRow key={n.id} n={n} />)
          )}
        </div>
        <div className="border-t border-border p-2">
          <Button asChild variant="ghost" size="sm" className="w-full justify-center">
            <Link href="/notifications">View all</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function NotificationRow({ n, dense = false }: { n: AppNotification; dense?: boolean }) {
  const Icon = TYPE_ICONS[n.type];
  return (
    <button
      onClick={(e) => {
        markNotificationRead(n.id, true);
        // Drop focus so the row's hover/focus styles don't stay stuck
        // when the user mouses away after clicking inside the popover.
        (e.currentTarget as HTMLButtonElement).blur();
      }}
      className={cn(
        "flex w-full items-start gap-3 px-4 text-left outline-none transition-colors hover:bg-accent/50 focus-visible:bg-accent/60",
        dense ? "py-2.5" : "py-3",
        !n.read && "bg-primary/[0.04]",
      )}
    >
      <div className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md", TYPE_COLORS[n.type])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate text-sm font-medium">{n.title}</div>
          {!n.read && <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
        </div>
        <div className="line-clamp-2 text-xs text-muted-foreground">{n.message}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground/80">{timeAgo(n.createdAt)}</div>
      </div>
    </button>
  );
}

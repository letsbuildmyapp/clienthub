"use client";

import { useMemo, useState } from "react";
import { Check, Inbox } from "lucide-react";
import { useDb } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationRow } from "@/components/app-shell/notifications-bell";
import { markAllNotificationsRead } from "@/lib/data/api";
import type { NotificationType } from "@/lib/types";

const FILTERS: { id: "all" | "unread" | NotificationType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "mention", label: "Mentions" },
  { id: "billing", label: "Billing" },
  { id: "system", label: "System" },
];

export default function NotificationsPage() {
  const db = useDb();
  const { user } = useAuth();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  if (!user) return null;

  const all = useMemo(
    () =>
      Object.values(db.notifications)
        .filter((n) => n.userId === user.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [db.notifications, user.id],
  );

  const unreadCount = all.filter((n) => !n.read).length;

  const filtered =
    filter === "all" ? all
    : filter === "unread" ? all.filter((n) => !n.read)
    : all.filter((n) => n.type === filter);

  return (
    <div className="container mx-auto max-w-3xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Inbox"
        description={
          unreadCount > 0
            ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
            : "You're all caught up."
        }
        actions={
          unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={() => markAllNotificationsRead(user.id)}>
              <Check className="h-4 w-4" /> Mark all read
            </Button>
          )
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="w-full sm:w-auto">
          {FILTERS.map((f) => (
            <TabsTrigger key={f.id} value={f.id}>{f.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
              <Inbox className="h-10 w-10 text-muted-foreground" />
              <div>
                <h3 className="text-base font-semibold">No notifications here</h3>
                <p className="text-sm text-muted-foreground">
                  When something needs your attention, it&apos;ll show up here.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n) => (
                <NotificationRow key={n.id} n={n} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

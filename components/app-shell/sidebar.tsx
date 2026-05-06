"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronsLeft,
  CreditCard,
  Inbox,
  Kanban,
  LayoutDashboard,
  LifeBuoy,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { TeamSwitcher } from "./team-switcher";
import { cn } from "@/lib/utils";
import { useDb } from "@/lib/data/hooks";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ("admin" | "owner" | "member")[];
  badgeKey?: "tickets" | "notifications";
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/projects", label: "Projects", icon: Kanban },
  { href: "/tickets", label: "Tickets", icon: LifeBuoy, badgeKey: "tickets" },
  { href: "/team", label: "Team", icon: Users },
  { href: "/billing", label: "Billing", icon: CreditCard, roles: ["owner", "admin"] },
  { href: "/notifications", label: "Inbox", icon: Inbox, badgeKey: "notifications" },
  { href: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/teams", label: "Teams", icon: Users },
  { href: "/admin/users", label: "Users", icon: ShieldCheck },
];

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onMobileClose,
}: {
  collapsed: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const pathname = usePathname();
  const { user, activeTeam } = useAuth();
  const db = useDb();

  if (!user) return null;
  const isAdminContext = pathname.startsWith("/admin") && user.role === "admin";

  const items = isAdminContext ? ADMIN_ITEMS : NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(user.role));

  const teamId = activeTeam?.id;
  const counts = {
    tickets: teamId
      ? Object.values(db.tickets).filter(
          (t) => t.teamId === teamId && (t.status === "open" || t.status === "in_progress"),
        ).length
      : 0,
    notifications: Object.values(db.notifications).filter(
      (n) => n.userId === user.id && !n.read,
    ).length,
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside
        className={cn(
          "flex h-screen shrink-0 flex-col border-r border-border bg-card/40 transition-all duration-200",
          "fixed inset-y-0 left-0 z-50 md:static md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed ? "w-60 md:w-16" : "w-60",
        )}
      >
      <div className="flex items-center justify-between gap-2 px-3 py-4">
        {!collapsed ? (
          <Link href={isAdminContext ? "/admin" : "/dashboard"} className="flex items-center gap-2 px-1.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500 text-primary-foreground shadow-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 18h6M4 12h10M4 6h16" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight">ClientHub</span>
          </Link>
        ) : (
          <Link href={isAdminContext ? "/admin" : "/dashboard"} className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-violet-500 text-primary-foreground">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 18h6M4 12h10M4 6h16" />
            </svg>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "hidden rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:inline-flex",
            collapsed && "absolute left-12 top-3 z-10 bg-card shadow",
          )}
          aria-label="Toggle sidebar"
        >
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {!isAdminContext && !collapsed && (
        <div className="px-3 pb-3">
          <TeamSwitcher onAfterSelect={onMobileClose} />
        </div>
      )}

      <nav className="flex-1 space-y-0.5 px-2 pt-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href + "/"));
          const badge = item.badgeKey ? counts[item.badgeKey] : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && badge > 0 && (
                <span className="ml-auto inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/15 px-1.5 text-[11px] font-semibold text-primary">
                  {badge}
                </span>
              )}
              {collapsed && badge > 0 && (
                <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </nav>

      {!isAdminContext && user.role === "admin" && (
        <div className="border-t border-border/60 p-2">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
            title="Admin panel"
          >
            <ShieldCheck className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Admin panel</span>}
          </Link>
        </div>
      )}

      {isAdminContext && (
        <div className="border-t border-border/60 p-2">
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
            title="Switch to dashboard"
          >
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Switch to dashboard</span>}
          </Link>
        </div>
      )}

      <div className={cn("border-t border-border/60 px-3 py-3 text-[11px] text-muted-foreground", collapsed && "text-center")}>
        {!collapsed ? (
          <div>
            <div className="font-medium text-foreground/80">v1.0 · Demo</div>
            <div>Mock data · localStorage</div>
          </div>
        ) : (
          <div className="h-1.5 w-1.5 rounded-full bg-success" title="Mock data online" />
        )}
      </div>
    </aside>
    </>
  );
}

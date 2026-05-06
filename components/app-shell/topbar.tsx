"use client";

import { Menu, Search } from "lucide-react";
import { NotificationsBell } from "./notifications-bell";
import { ThemeToggle } from "./theme-toggle";
import { UserMenu } from "./user-menu";

export function Topbar({ onMobileMenu }: { onMobileMenu?: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
      {onMobileMenu && (
        <button
          onClick={onMobileMenu}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      )}
      <div className="relative flex max-w-sm flex-1 items-center">
        <Search className="absolute left-3 h-3.5 w-3.5 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search projects, tickets, members…"
          className="h-9 w-full rounded-md border border-input bg-background/40 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <kbd className="absolute right-2 hidden rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </div>
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <NotificationsBell />
        <div className="mx-2 h-6 w-px bg-border" />
        <UserMenu />
      </div>
    </header>
  );
}

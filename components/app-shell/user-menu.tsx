"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronsUpDown, LogOut, RefreshCw, Settings, ShieldCheck, UserCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/context";
import { logout } from "@/lib/data/api";
import { UserAvatar } from "@/components/shared/user-avatar";
import { store } from "@/lib/mock/store";
import { toast } from "sonner";

export function UserMenu() {
  const { user } = useAuth();
  const router = useRouter();
  if (!user) return null;

  function onResetDemo() {
    store.reset();
    toast.success("Demo data reset.");
    setTimeout(() => router.push("/login"), 200);
  }

  function onLogout() {
    logout();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md p-1 pr-2 text-left transition-colors hover:bg-accent">
          <UserAvatar name={user.name} color={user.avatarColor} className="h-7 w-7" />
          <div className="hidden min-w-0 sm:block">
            <div className="truncate text-sm font-medium leading-tight">{user.name}</div>
            <div className="truncate text-[11px] text-muted-foreground capitalize">{user.role}</div>
          </div>
          <ChevronsUpDown className="hidden h-3 w-3 text-muted-foreground sm:block" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex items-center gap-2 p-2">
          <UserAvatar name={user.name} color={user.avatarColor} className="h-9 w-9" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{user.name}</div>
            <div className="truncate text-xs text-muted-foreground">{user.email}</div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/settings"><UserCircle /> Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings"><Settings /> Settings</Link>
        </DropdownMenuItem>
        {user.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin"><ShieldCheck /> Admin panel</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Demo controls</DropdownMenuLabel>
        <DropdownMenuItem onClick={onResetDemo}>
          <RefreshCw /> Reset demo data
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout} className="text-destructive focus:text-destructive">
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

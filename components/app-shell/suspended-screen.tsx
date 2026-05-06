"use client";

import { useRouter } from "next/navigation";
import { Lock, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/data/api";
import { useAuth } from "@/lib/auth/context";

export function SuspendedScreen() {
  const router = useRouter();
  const { activeTeam } = useAuth();
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <Lock className="h-7 w-7" />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">This workspace is suspended</h1>
        <p className="text-muted-foreground">
          {activeTeam?.name ?? "Your team"} has been suspended. Contact our team or your account admin to restore access.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { logout(); router.push("/login"); }}>
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
        <Button>Contact support</Button>
      </div>
    </div>
  );
}

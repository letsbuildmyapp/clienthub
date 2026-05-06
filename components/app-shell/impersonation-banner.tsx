"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/context";
import { exitImpersonation } from "@/lib/data/api";
import { toast } from "sonner";

export function ImpersonationBanner() {
  const { isImpersonating, user, impersonator } = useAuth();
  const router = useRouter();
  if (!isImpersonating || !user || !impersonator) return null;
  return (
    <div className="flex items-center justify-between gap-3 border-b border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm sm:px-6">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <ShieldAlert className="h-4 w-4" />
        <span>
          Viewing as <span className="font-semibold">{user.name}</span> ({user.email}) — actions you take will be attributed to them.
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 border-amber-500/40 text-xs hover:bg-amber-500/20"
        onClick={() => {
          exitImpersonation();
          toast.success("Returned to admin view.");
          router.push("/admin/users");
        }}
      >
        <X className="h-3 w-3" /> Exit
      </Button>
    </div>
  );
}

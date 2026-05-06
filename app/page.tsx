"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDb } from "@/lib/data/hooks";

export default function RootPage() {
  const db = useDb();
  const router = useRouter();
  useEffect(() => {
    if (db.session.userId) router.replace("/dashboard");
    else router.replace("/login");
  }, [db.session.userId, router]);
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-shimmer rounded-full bg-gradient-to-r from-transparent via-primary to-transparent bg-[length:200%_100%]" />
      </div>
    </div>
  );
}

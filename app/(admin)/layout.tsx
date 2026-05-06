"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/app-shell/sidebar";
import { Topbar } from "@/components/app-shell/topbar";
import { ImpersonationBanner } from "@/components/app-shell/impersonation-banner";
import { useAuth } from "@/lib/auth/context";
import { useDb } from "@/lib/data/hooks";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const db = useDb();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (!hydrated) return;
    if (!db.session.userId) router.replace("/login");
    else if (user && user.role !== "admin") router.replace("/dashboard");
  }, [hydrated, db.session.userId, user, router]);

  if (!hydrated || !user || user.role !== "admin") {
    return <div className="h-screen w-screen bg-background" />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <ImpersonationBanner />
        <Topbar onMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

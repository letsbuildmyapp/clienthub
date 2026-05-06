"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck, UserCog, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, loginAs } from "@/lib/data/api";
import { Card } from "@/components/ui/card";
import { useDb } from "@/lib/data/hooks";

const DEMO_LOGINS = [
  {
    id: "user_admin",
    label: "Admin",
    description: "Platform admin",
    icon: ShieldCheck,
    color: "from-indigo-500 to-violet-500",
  },
  {
    id: "user_owner",
    label: "Team Owner",
    description: "Northwind Marketing",
    icon: UserCog,
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    id: "user_member",
    label: "Team Member",
    description: "Cobalt Health",
    icon: Users,
    color: "from-emerald-500 to-teal-500",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const db = useDb();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

  useEffect(() => {
    if (db.session.userId) {
      const u = db.users[db.session.userId];
      router.replace(u?.role === "admin" ? "/admin" : "/dashboard");
    }
  }, [db.session.userId, db.users, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const user = login(email, password);
      setLoading(false);
      if (!user) {
        toast.error("Couldn't find an account with that email and password.");
        return;
      }
      toast.success(`Welcome back, ${user.name.split(" ")[0]}.`);
      router.push("/dashboard");
    }, 250);
  }

  function onDemoLogin(userId: string) {
    setDemoLoading(userId);
    setTimeout(() => {
      const user = loginAs(userId);
      setDemoLoading(null);
      if (!user) return;
      toast.success(`Signed in as ${user.name}.`);
      router.push(user.role === "admin" ? "/admin" : "/dashboard");
    }, 200);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-[440px]"
    >
      <Card className="relative overflow-hidden border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-sm">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in to ClientHub</h1>
          <p className="text-sm text-muted-foreground">
            New here?{" "}
            <Link href="/signup" className="font-medium text-foreground underline-offset-4 hover:underline">
              Create an account
            </Link>
          </p>
        </div>

        <div className="my-6 grid gap-2">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              One-click demo logins
            </span>
            <span className="text-[10px] text-muted-foreground">No password needed</span>
          </div>
          {DEMO_LOGINS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => onDemoLogin(d.id)}
              disabled={demoLoading !== null}
              className="group flex items-center gap-3 rounded-lg border border-border/70 bg-background/40 p-3 text-left transition-all hover:border-primary/40 hover:bg-background disabled:opacity-50"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${d.color} text-white shadow-sm`}
              >
                <d.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{d.label}</div>
                <div className="truncate text-xs text-muted-foreground">{d.description}</div>
              </div>
              {demoLoading === d.id ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              )}
            </button>
          ))}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-wider">
            <span className="bg-card/80 px-3 text-muted-foreground">or sign in with email</span>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
          </Button>
        </form>
      </Card>
    </motion.div>
  );
}

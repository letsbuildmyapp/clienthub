"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { signup } from "@/lib/data/api";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      try {
        signup({ email, password, name, teamName: team });
        toast.success(`Welcome to ClientHub, ${name.split(" ")[0]}!`);
        router.push("/dashboard");
      } catch {
        toast.error("Couldn't create your account.");
      } finally {
        setLoading(false);
      }
    }, 250);
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
          <h1 className="text-2xl font-semibold tracking-tight">Start your trial</h1>
          <p className="text-sm text-muted-foreground">
            Free for 14 days. No credit card required.{" "}
            <Link href="/login" className="font-medium text-foreground underline-offset-4 hover:underline">
              Sign in instead
            </Link>
          </p>
        </div>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="team">Team name</Label>
              <Input id="team" value={team} onChange={(e) => setTeam(e.target.value)} placeholder="Acme Co." required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@acme.com" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={4} />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            By signing up you agree to our terms of service and privacy policy.
          </p>
        </form>
      </Card>
    </motion.div>
  );
}

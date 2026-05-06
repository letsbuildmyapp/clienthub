"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 400);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-[440px]"
    >
      <Card className="border-border/60 bg-card/80 p-8 shadow-2xl backdrop-blur-sm">
        {sent ? (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Check your inbox</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We sent reset instructions to <span className="font-medium text-foreground">{email}</span>.
              </p>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/login">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
              <p className="text-sm text-muted-foreground">
                Enter the email associated with your account and we&apos;ll send you a reset link.
              </p>
            </div>
            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/login">
                  <ArrowLeft className="h-4 w-4" /> Back to sign in
                </Link>
              </Button>
            </form>
          </>
        )}
      </Card>
    </motion.div>
  );
}

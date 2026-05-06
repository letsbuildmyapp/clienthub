"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CreditCard,
  Download,
  ExternalLink,
  Loader2,
  Pencil,
  Sparkles,
  Zap,
} from "lucide-react";
import { useDb } from "@/lib/data/hooks";
import { useAuth } from "@/lib/auth/context";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PLANS, planById } from "@/lib/plans";
import { changePlan, payInvoice } from "@/lib/data/api";
import { cn, formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import type { Invoice, PlanId } from "@/lib/types";

const PLAN_ICONS: Record<PlanId, React.ComponentType<{ className?: string }>> = {
  starter: Sparkles,
  growth: Zap,
  scale: Sparkles,
};

export default function BillingPage() {
  const db = useDb();
  const { user, activeTeam } = useAuth();

  if (!user || !activeTeam) return null;

  const plan = planById(activeTeam.plan);
  const invoices = useMemo(
    () =>
      Object.values(db.invoices)
        .filter((i) => i.teamId === activeTeam.id)
        .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()),
    [db.invoices, activeTeam.id],
  );

  return (
    <div className="container mx-auto max-w-[1200px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <PageHeader
        title="Billing"
        description={`Manage your plan, payment method, and invoices for ${activeTeam.name}.`}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-start justify-between space-y-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CardTitle>Current plan</CardTitle>
                <Badge variant="default">{plan.name}</Badge>
              </div>
              <CardDescription>
                {formatCurrency(plan.priceCents)} per month · billed monthly · next renewal{" "}
                {new Date(Date.now() + 30 * 86400_000).toLocaleDateString("en-US", { month: "long", day: "numeric" })}
              </CardDescription>
            </div>
            <UpdatePaymentDialog />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <UsageBlock label="Seats" value={activeTeam.seatsUsed} max={plan.limits.seats} />
              <UsageBlock label="Projects" value={Object.values(db.tasks).filter((t) => t.teamId === activeTeam.id).length} max={plan.limits.projects > 99 ? 999 : plan.limits.projects} unit="" />
              <UsageBlock label="Storage" value={activeTeam.storageUsedGb} max={plan.limits.storageGb} unit="GB" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payment method</CardTitle>
            <CardDescription>Default card on file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white shadow-sm dark:from-slate-800 dark:to-slate-900">
              <div className="flex items-start justify-between">
                <CreditCard className="h-5 w-5 text-white/70" />
                <span className="text-xs uppercase tracking-wider text-white/70">Visa</span>
              </div>
              <div className="mt-6 font-mono text-sm tracking-wider">
                •••• •••• •••• 4242
              </div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-[11px] text-white/60">EXPIRES 09/28</span>
                <span className="text-xs">{user.name}</span>
              </div>
            </div>
            <UpdatePaymentDialog full />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
          <CardDescription>Upgrade or downgrade at any time. Prorated automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((p) => {
              const isCurrent = p.id === activeTeam.plan;
              const isUpgrade = rankOf(p.id) > rankOf(activeTeam.plan);
              return (
                <PlanCard
                  key={p.id}
                  planId={p.id}
                  isCurrent={isCurrent}
                  isUpgrade={isUpgrade}
                  highlighted={p.id === "growth"}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice history</CardTitle>
          <CardDescription>Click any invoice to view a printable receipt.</CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-2 text-left font-medium">Invoice</th>
                  <th className="px-6 py-2 text-left font-medium">Period</th>
                  <th className="hidden px-6 py-2 text-left font-medium sm:table-cell">Plan</th>
                  <th className="px-6 py-2 text-right font-medium">Amount</th>
                  <th className="px-6 py-2 text-left font-medium">Status</th>
                  <th className="px-6 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.map((inv) => (
                  <InvoiceRow key={inv.id} invoice={inv} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function rankOf(p: PlanId) {
  return p === "starter" ? 1 : p === "growth" ? 2 : 3;
}

function UsageBlock({ label, value, max, unit }: { label: string; value: number; max: number; unit?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(1, max)) * 100));
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-1 text-xl font-semibold tabular-nums">
        {value}
        {unit ? <span className="ml-1 text-sm text-muted-foreground">{unit}</span> : null}
        <span className="ml-1 text-sm font-normal text-muted-foreground">/ {max}{unit ? ` ${unit}` : ""}</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full transition-all", pct > 85 ? "bg-amber-500" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function PlanCard({ planId, isCurrent, isUpgrade, highlighted }: { planId: PlanId; isCurrent: boolean; isUpgrade: boolean; highlighted: boolean }) {
  const { activeTeam } = useAuth();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const plan = planById(planId);
  const Icon = PLAN_ICONS[planId];

  function onConfirm() {
    if (!activeTeam) return;
    setSubmitting(true);
    setTimeout(() => {
      changePlan(activeTeam.id, planId);
      setSubmitting(false);
      setOpen(false);
      toast.success(`Plan changed to ${plan.name}`);
    }, 350);
  }

  return (
    <div
      className={cn(
        "relative rounded-xl border p-5 transition-all",
        isCurrent ? "border-primary/50 bg-primary/[0.04]" : highlighted ? "border-border bg-card shadow-sm" : "border-border bg-card",
      )}
    >
      {highlighted && !isCurrent && (
        <Badge className="absolute right-4 top-4">Most popular</Badge>
      )}
      {isCurrent && (
        <Badge className="absolute right-4 top-4" variant="default">Current</Badge>
      )}
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-base font-semibold">{plan.name}</div>
      </div>
      <div className="mb-4 flex items-baseline gap-1">
        <span className="text-3xl font-bold tracking-tight">{formatCurrency(plan.priceCents)}</span>
        <span className="text-sm text-muted-foreground">/mo</span>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">{plan.description}</p>
      <ul className="mb-5 space-y-2 text-sm">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            className="w-full"
            variant={isCurrent ? "outline" : highlighted ? "default" : "outline"}
            disabled={isCurrent}
          >
            {isCurrent ? (
              "Current plan"
            ) : isUpgrade ? (
              <>
                <ArrowUp className="h-4 w-4" /> Upgrade to {plan.name}
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4" /> Switch to {plan.name}
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isUpgrade ? "Upgrade" : "Change"} to {plan.name}?</DialogTitle>
            <DialogDescription>
              You&apos;ll be billed {formatCurrency(plan.priceCents)} per month. The change is prorated immediately.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={onConfirm} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : isUpgrade ? "Confirm upgrade" : "Confirm change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UpdatePaymentDialog({ full = false }: { full?: boolean }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [number, setNumber] = useState("");
  const [exp, setExp] = useState("");
  const [cvc, setCvc] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setOpen(false);
      toast.success("Payment method updated");
    }, 500);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {full ? (
          <Button variant="outline" className="w-full">
            <Pencil className="h-4 w-4" /> Update card
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" /> Update payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update payment method</DialogTitle>
          <DialogDescription>
            Securely update your card. We don&apos;t store full card numbers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1.5">
            <Label>Card number</Label>
            <Input
              placeholder="4242 4242 4242 4242"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
              maxLength={19}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Expiry</Label>
              <Input placeholder="MM/YY" value={exp} onChange={(e) => setExp(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label>CVC</Label>
              <Input placeholder="123" value={cvc} onChange={(e) => setCvc(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const period = new Date(invoice.periodStart).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return (
    <tr className="hover:bg-accent/30">
      <td className="px-6 py-3 font-mono text-xs">{invoice.number}</td>
      <td className="px-6 py-3 text-sm">{period}</td>
      <td className="hidden px-6 py-3 text-sm capitalize sm:table-cell">{planById(invoice.plan).name}</td>
      <td className="px-6 py-3 text-right font-medium tabular-nums">{formatCurrency(invoice.amountCents)}</td>
      <td className="px-6 py-3">
        <Badge
          variant={invoice.status === "paid" ? "success" : invoice.status === "open" ? "warning" : "secondary"}
          className="capitalize"
        >
          {invoice.status}
        </Badge>
      </td>
      <td className="px-6 py-3 text-right">
        <div className="flex items-center justify-end gap-1">
          {invoice.status === "open" && (
            <Button
              size="sm"
              variant="outline"
              className="h-7"
              onClick={() => {
                payInvoice(invoice.id);
                toast.success(`Invoice ${invoice.number} paid`);
              }}
            >
              Pay now
            </Button>
          )}
          <a
            href={`/invoice/${invoice.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 items-center gap-1 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" /> View
          </a>
        </div>
      </td>
    </tr>
  );
}

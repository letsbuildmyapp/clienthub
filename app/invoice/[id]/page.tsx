"use client";

import { useEffect, useState } from "react";
import { Printer } from "lucide-react";
import { use } from "react";
import { store } from "@/lib/mock/store";
import type { Invoice, Team } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { planById } from "@/lib/plans";

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ invoice: Invoice | null; team: Team | null }>({ invoice: null, team: null });

  useEffect(() => {
    store.hydrate();
    const db = store.getSnapshot();
    const inv = db.invoices[id] ?? null;
    const team = inv ? db.teams[inv.teamId] : null;
    setData({ invoice: inv, team });
  }, [id]);

  if (!data.invoice || !data.team) {
    return (
      <div className="flex h-screen items-center justify-center bg-white text-slate-700">
        <div className="text-sm">Invoice not found.</div>
      </div>
    );
  }

  const inv = data.invoice;
  const team = data.team;
  const plan = planById(inv.plan);
  const subtotal = inv.lineItems.reduce((s, l) => s + l.quantity * l.unitCents, 0);
  const tax = 0;
  const total = subtotal + tax;

  return (
    <div className="min-h-screen bg-slate-100 py-10 print:bg-white print:py-0">
      <div className="mx-auto max-w-[800px] bg-white px-12 py-10 text-slate-800 shadow-2xl print:shadow-none">
        <div className="flex items-start justify-between border-b border-slate-200 pb-8">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 18h6M4 12h10M4 6h16" />
                </svg>
              </div>
              <span className="text-lg font-bold tracking-tight">ClientHub</span>
            </div>
            <div className="text-xs text-slate-500">
              ClientHub, Inc. · 2261 Market St #5403 · San Francisco, CA 94114
            </div>
            <div className="text-xs text-slate-500">billing@clienthub.dev · clienthub.dev</div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold tracking-tight text-slate-900">Invoice</div>
            <div className="mt-1 text-sm font-mono text-slate-500">{inv.number}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 py-8">
          <div>
            <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Bill to</div>
            <div className="text-sm font-semibold">{team.name}</div>
            <div className="text-sm text-slate-600">{team.billingContact}</div>
            <div className="text-sm text-slate-500">{team.industry}</div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Issue date</div>
              <div>{new Date(inv.issuedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</div>
              <div className="font-medium uppercase">
                {inv.status === "paid" ? (
                  <span className="text-emerald-600">Paid</span>
                ) : inv.status === "open" ? (
                  <span className="text-amber-600">Due</span>
                ) : (
                  <span className="text-slate-500">Void</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Period</div>
              <div>
                {new Date(inv.periodStart).toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
                {new Date(inv.periodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Plan</div>
              <div>{plan.name}</div>
            </div>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-y border-slate-200 text-left">
              <th className="py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Description</th>
              <th className="py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Qty</th>
              <th className="py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Unit price</th>
              <th className="py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount</th>
            </tr>
          </thead>
          <tbody>
            {inv.lineItems.map((l, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-3">{l.description}</td>
                <td className="py-3 text-right tabular-nums">{l.quantity}</td>
                <td className="py-3 text-right tabular-nums">{formatCurrency(l.unitCents)}</td>
                <td className="py-3 text-right font-medium tabular-nums">{formatCurrency(l.quantity * l.unitCents)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 ml-auto w-[280px] space-y-2 text-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span>Subtotal</span>
            <span className="tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-500">
            <span>Tax</span>
            <span className="tabular-nums">{formatCurrency(tax)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatCurrency(total)}</span>
          </div>
          {inv.status === "paid" && inv.paidAt && (
            <div className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              Paid via Visa •••• 4242 on{" "}
              {new Date(inv.paidAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          )}
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6 text-xs text-slate-500">
          <p className="mb-1 font-medium text-slate-700">Thanks for being a ClientHub customer.</p>
          <p>Questions? Reply to this email or contact billing@clienthub.dev.</p>
          <p className="mt-3">ClientHub, Inc. · EIN 88-1234567 · This is a portfolio demo by Let&apos;s Build My App.</p>
        </div>

        <div className="mt-8 flex justify-end print:hidden">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-slate-800"
          >
            <Printer className="h-4 w-4" /> Print or save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}

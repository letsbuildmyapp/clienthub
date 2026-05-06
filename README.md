# ClientHub — SaaS Client Portal Demo

A polished, working portfolio demo of a SaaS client portal — projects, billing,
support, notifications, team management, and a platform admin panel — built by
[Let's Build My App](https://letsbuildmyapp.com) to show prospective clients
what we can build.

> **Heads up:** this is a portfolio demo. It runs on a local in-memory mock
> backed by `localStorage`. No real Firebase project is needed.

## Quick start

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. That's it — zero configuration, fully seeded with
realistic demo data on first load.

## One-click demo logins

The login page exposes three demo accounts as buttons (no password needed):

| Role         | Account                  | What you'll see                       |
| ------------ | ------------------------ | ------------------------------------- |
| Admin        | `admin@clienthub.dev`    | Platform admin: every team, every user, impersonation |
| Team Owner   | `owner@northwind.co`     | Owner of two teams (Northwind & Drift) — full billing/team controls |
| Team Member  | `member@cobalt.io`       | Standard team member view at Cobalt Health |

If you'd rather sign in by hand, every seeded user's password is `demo1234`.

## What's mocked

- **Firebase / Firestore** — replaced by an in-memory store (`lib/mock/store.ts`)
  that persists to `localStorage`. The same data shape would map cleanly to a
  real Firestore schema.
- **Firebase Auth** — `lib/data/api.ts:login` checks credentials against the
  same in-memory store.
- **Stripe** — completely mocked. Plans, payment method, invoices, and the
  printable HTML receipt are all generated client-side. No Stripe SDK is
  installed.
- **Email / invite delivery** — invite flows produce a toast and a notification,
  but no real email is sent.
- **System health widgets** — always green (this is a demo).

When you're ready to wire up real Firebase, copy `.env.local.example` to
`.env.local` and fill in the keys; `lib/firebase/init.ts` is the only place that
needs to switch to live SDKs.

## Resetting the demo

If the data ever gets messy mid-call, click the user avatar in the top-right and
pick **Reset demo data**. This wipes `localStorage`, re-seeds, and bounces you
back to the login page. The seed is deterministic — names, teams, MRR, etc. will
look identical every time.

You can also reset by clearing site data in your browser devtools.

## What's in the demo

- **Auth** — login, signup, forgot password (UI flow only), one-click demo logins
- **Roles** — `admin`, `owner`, `member` gate nav, routes, and actions
- **Dashboard** — 4 stat cards with sparklines, 30-day activity chart, kanban
  preview with drag-and-drop, recent tickets, activity feed, plan/usage card
- **Projects** — full kanban board with DnD across To Do / In Progress / Done
- **Tickets** — searchable, filterable list with inline status changes
- **Team** — member roster with invite / change role / remove
- **Billing** — current plan, payment method, plan picker with
  upgrade/downgrade flow, 6-month invoice history per team, **printable HTML
  invoice** in a new tab
- **Notifications** — bell dropdown + dedicated inbox page with filters; real
  actions (invites, plan changes, ticket activity) generate notifications live
- **Admin panel** (`/admin`) — platform overview, teams table with
  suspend/reactivate, users table with **impersonation** (banner + exit button),
  system health
- **Theme** — dark mode by default; the toggle in the top bar is real
- **Mobile** — responsive at minimum (sidebar collapses)

## Project structure

```
app/
  (auth)/      login, signup, forgot-password
  (app)/       dashboard, projects, tickets, team, billing, notifications, settings
  (admin)/     admin/, admin/teams/, admin/users/
  invoice/     standalone printable HTML invoice
lib/
  firebase/    init shim (with mock fallback)
  mock/        in-memory store + localStorage persistence + seed data
  data/        api functions + React hook for the store
  auth/        AuthProvider context wrapping useDb
  plans.ts     Starter / Growth / Scale plan definitions
  types.ts     all entity types (Team, User, Task, Ticket, Invoice…)
components/
  ui/          shadcn primitives (Button, Card, Dialog, Tabs, etc.)
  app-shell/   sidebar, topbar, team switcher, notifications bell, user menu
  dashboard/   stat card, activity chart, kanban board, tickets panel, activity feed
  shared/      avatar / team logo helpers
```

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS (custom theme + dark mode)
- shadcn/ui-style primitives (built into `components/ui/`)
- `recharts` for charts and sparklines
- `@dnd-kit` for the kanban drag-and-drop
- `framer-motion` for subtle page transitions
- `sonner` for toasts
- `next-themes` for the dark/light toggle

## Deploying

Drop it on Vercel — no environment variables required for the demo. The
`.env.local.example` shows which `NEXT_PUBLIC_FIREBASE_*` keys to set when
swapping in a real Firebase project.

---

Built by [Let's Build My App](https://letsbuildmyapp.com).

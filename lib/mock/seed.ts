import type {
  ActivityEvent,
  AppNotification,
  Database,
  DailyMetric,
  Invoice,
  ProjectTask,
  Team,
  Ticket,
  User,
} from "@/lib/types";
import { planById } from "@/lib/plans";

// Deterministic PRNG so the seed is identical across reloads.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260505);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) =>
  Math.floor(rand() * (max - min + 1)) + min;

const id = (prefix: string) =>
  `${prefix}_${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-3)}`;

function isoAgo(days: number, hours = 0) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(d.getHours() - hours);
  return d.toISOString();
}

const AVATAR_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-sky-500",
  "bg-blue-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-fuchsia-500",
  "bg-pink-500",
];

const TEAM_COLORS = [
  "bg-violet-600",
  "bg-emerald-600",
  "bg-rose-600",
  "bg-amber-600",
  "bg-sky-600",
];

const TEAMS_SEED: Omit<Team, "createdAt" | "mrrCents" | "seatsUsed" | "storageUsedGb">[] = [
  {
    id: "team_northwind",
    name: "Northwind Marketing",
    industry: "Marketing Agency",
    logoColor: TEAM_COLORS[0],
    plan: "growth",
    suspended: false,
    billingContact: "billing@northwind.co",
  },
  {
    id: "team_cobalt",
    name: "Cobalt Health",
    industry: "Healthcare SaaS",
    logoColor: TEAM_COLORS[1],
    plan: "scale",
    suspended: false,
    billingContact: "ap@cobalthealth.io",
  },
  {
    id: "team_maven",
    name: "Maven & Hart Legal",
    industry: "Law Firm",
    logoColor: TEAM_COLORS[2],
    plan: "growth",
    suspended: false,
    billingContact: "ops@mavenhart.com",
  },
  {
    id: "team_apex",
    name: "Apex Athletics",
    industry: "Fitness Studio",
    logoColor: TEAM_COLORS[3],
    plan: "starter",
    suspended: false,
    billingContact: "finance@apexathletics.fit",
  },
  {
    id: "team_drift",
    name: "Drift Commerce",
    industry: "E-commerce",
    logoColor: TEAM_COLORS[4],
    plan: "growth",
    suspended: false,
    billingContact: "billing@driftcommerce.com",
  },
];

const FIRST_NAMES = [
  "Sarah", "Marcus", "Priya", "Diego", "Elena", "Tomás", "Anika", "Jordan",
  "Kenji", "Maya", "Reza", "Lena", "Caleb", "Yuki", "Nadia", "Imani",
  "Olivia", "Wesley", "Camila", "Ezra", "Harper", "Niko", "Saoirse", "Theo",
  "Amara", "Kai", "Renée", "Felix",
];

const LAST_NAMES = [
  "Chen", "Okafor", "Patel", "Reyes", "Kowalski", "Mendes", "Singh", "Park",
  "Hayashi", "Brennan", "Ferrari", "Hassan", "Lindgren", "Tanaka", "Volkov",
  "Adebayo", "Zhang", "Castellanos", "Ó Briain", "Gallagher", "Mahmoud",
  "Fernandez", "Holm",
];

const TITLES_BY_TEAM: Record<string, string[]> = {
  team_northwind: ["Brand Strategist", "Creative Director", "Account Manager", "Copywriter", "Senior Designer"],
  team_cobalt: ["Product Manager", "Engineering Lead", "Senior Engineer", "Clinical Liaison", "Data Scientist"],
  team_maven: ["Partner", "Associate Attorney", "Paralegal", "Operations Lead", "Compliance Manager"],
  team_apex: ["Studio Owner", "Head Coach", "Membership Lead", "Marketing Manager", "Front Desk Lead"],
  team_drift: ["Head of Growth", "Merchandising Lead", "CX Manager", "Logistics Coordinator", "Performance Marketer"],
};

function buildSeed(): Database {
  const teams: Record<string, Team> = {};
  TEAMS_SEED.forEach((t, i) => {
    const plan = planById(t.plan);
    teams[t.id] = {
      ...t,
      createdAt: isoAgo(180 + i * 30),
      mrrCents: plan.priceCents,
      seatsUsed: 0,
      storageUsedGb: between(2, plan.limits.storageGb - 1),
    };
  });

  const users: Record<string, User> = {};
  const passwords: Record<string, string> = {};
  let userIdx = 0;

  // Demo accounts visible on the login page.
  users["user_admin"] = {
    id: "user_admin",
    email: "admin@clienthub.dev",
    name: "Avery Sterling",
    title: "Platform Admin",
    role: "admin",
    teamIds: [],
    primaryTeamId: null,
    avatarColor: "bg-indigo-600",
    status: "active",
    joinedAt: isoAgo(420),
  };
  passwords["admin@clienthub.dev"] = "demo1234";

  users["user_owner"] = {
    id: "user_owner",
    email: "owner@northwind.co",
    name: "Sarah Chen",
    title: "Founder & CEO",
    role: "owner",
    teamIds: ["team_northwind", "team_drift"],
    primaryTeamId: "team_northwind",
    avatarColor: "bg-violet-500",
    status: "active",
    joinedAt: isoAgo(360),
  };
  passwords["owner@northwind.co"] = "demo1234";

  users["user_member"] = {
    id: "user_member",
    email: "member@cobalt.io",
    name: "Marcus Okafor",
    title: "Senior Product Engineer",
    role: "member",
    teamIds: ["team_cobalt"],
    primaryTeamId: "team_cobalt",
    avatarColor: "bg-emerald-500",
    status: "active",
    joinedAt: isoAgo(120),
  };
  passwords["member@cobalt.io"] = "demo1234";

  // Build the rest of the team rosters, ~20 total users.
  const teamRosters: Record<string, string[]> = {
    team_northwind: ["user_owner"],
    team_cobalt: ["user_member"],
    team_maven: [],
    team_apex: [],
    team_drift: ["user_owner"],
  };

  TEAMS_SEED.forEach((team) => {
    const titles = TITLES_BY_TEAM[team.id];
    const memberCount = team.id === "team_apex" ? 3 : 4;
    for (let i = 0; i < memberCount; i++) {
      userIdx++;
      const first = FIRST_NAMES[(userIdx * 3) % FIRST_NAMES.length];
      const last = LAST_NAMES[(userIdx * 5) % LAST_NAMES.length];
      const name = `${first} ${last}`;
      const uid = `user_${team.id.split("_")[1]}_${i}`;
      const isOwner = i === 0 && team.id !== "team_northwind";
      const emailDomain =
        team.id === "team_northwind" ? "northwind.co"
        : team.id === "team_cobalt" ? "cobalthealth.io"
        : team.id === "team_maven" ? "mavenhart.com"
        : team.id === "team_apex" ? "apexathletics.fit"
        : "driftcommerce.com";
      users[uid] = {
        id: uid,
        email: `${first.toLowerCase()}.${last.toLowerCase().replace(/[^a-z]/g, "")}@${emailDomain}`,
        name,
        title: titles[i % titles.length],
        role: isOwner ? "owner" : "member",
        teamIds: [team.id],
        primaryTeamId: team.id,
        avatarColor: AVATAR_COLORS[userIdx % AVATAR_COLORS.length],
        status: "active",
        joinedAt: isoAgo(between(20, 300)),
      };
      passwords[users[uid].email] = "demo1234";
      teamRosters[team.id].push(uid);
    }
  });

  Object.values(teams).forEach((team) => {
    team.seatsUsed = teamRosters[team.id].length;
  });

  // Tasks
  const tasks: Record<string, ProjectTask> = {};
  const TASK_TITLES_BY_TEAM: Record<string, string[]> = {
    team_northwind: [
      "Q2 brand refresh — moodboard review",
      "Northwind site redesign discovery",
      "Pitch deck for Hartwell Foods",
      "Holiday campaign creative",
      "Update typography system",
      "Migrate analytics to GA4",
      "Newsletter template overhaul",
      "Photo shoot scheduling — June",
      "Client onboarding flow audit",
      "SEO audit — Lumen Coffee",
      "Social calendar — Q3",
      "Partnership pitch — Verge",
    ],
    team_cobalt: [
      "Migrate billing to new system",
      "Onboarding flow redesign",
      "HIPAA compliance review",
      "Patient portal v2 specs",
      "FHIR data import pipeline",
      "Mobile app iOS submission",
      "Reduce dashboard p95 latency",
      "Support handoff playbook",
      "Q3 OKRs draft",
      "Beta program — Tier 2 hospitals",
      "Auth: SSO support for Okta",
      "Deprecate legacy reports API",
    ],
    team_maven: [
      "Hartford v. Greene — discovery prep",
      "Compliance memo — California AB-587",
      "Client intake automation",
      "Document retention policy update",
      "Bar admission renewal — Q3",
      "Update conflict-of-interest screening",
      "Brief: Westlake Holdings injunction",
      "Pro bono case review",
      "Office relocation planning",
      "Junior associate onboarding",
    ],
    team_apex: [
      "Spring class schedule launch",
      "New member onboarding emails",
      "Trainer certification renewals",
      "Equipment maintenance — May",
      "Membership pricing review",
      "Studio open house — May 18",
      "Update intro flow video",
      "Apparel vendor renegotiation",
    ],
    team_drift: [
      "Black Friday landing page",
      "Inventory forecast — Q3",
      "Returns flow redesign",
      "Shopify → headless migration plan",
      "TikTok creator outreach",
      "Subscription program launch",
      "Wholesale portal MVP",
      "Customer reviews moderation tool",
      "Tax compliance — EU expansion",
      "Site speed audit",
    ],
  };

  Object.entries(TASK_TITLES_BY_TEAM).forEach(([teamId, titles]) => {
    const roster = teamRosters[teamId];
    titles.forEach((title, idx) => {
      const status: ProjectTask["status"] =
        idx < titles.length * 0.35 ? "todo"
        : idx < titles.length * 0.7 ? "in_progress"
        : "done";
      const priority: ProjectTask["priority"] = pick(["low", "medium", "medium", "high", "urgent"]);
      const tid = `task_${teamId}_${idx}`;
      tasks[tid] = {
        id: tid,
        teamId,
        title,
        description: "",
        status,
        priority,
        assigneeId: pick(roster) ?? null,
        dueDate: isoAgo(-between(1, 30)),
        createdAt: isoAgo(between(1, 45)),
        order: idx,
        tags: pick([
          ["design"], ["engineering"], ["marketing"], ["ops"],
          ["urgent"], ["review"], ["client-facing"], [],
        ]),
      };
    });
  });

  // Tickets
  const tickets: Record<string, Ticket> = {};
  const TICKET_SUBJECTS = [
    "Can't export invoices to CSV",
    "Two-factor auth not sending codes",
    "Bulk import failing for >500 rows",
    "Calendar sync stopped working",
    "Dashboard shows old data after refresh",
    "Custom domain SSL renewal",
    "Permission denied on report download",
    "Slack integration disconnected",
    "Need to merge two duplicate accounts",
    "Webhook signing secret rotation",
    "Mobile app crash on startup (iOS 18.2)",
    "Email notifications going to spam",
    "Increase API rate limit for batch job",
    "Restore deleted project from last week",
    "How to bulk archive tasks?",
    "Billing receipt missing line items",
    "Audit log retention question",
    "Can we get SSO via Okta?",
    "API timeout on /reports endpoint",
    "Dark mode broken on Firefox",
  ];

  let ticketNum = 1042;
  Object.keys(teamRosters).forEach((teamId) => {
    const count = between(3, 5);
    const roster = teamRosters[teamId];
    for (let i = 0; i < count; i++) {
      const subject = pick(TICKET_SUBJECTS);
      const status: Ticket["status"] = pick(["open", "open", "in_progress", "waiting", "resolved", "closed"]);
      const tid = `ticket_${teamId}_${i}`;
      const priority: Ticket["priority"] = pick(["low", "medium", "medium", "high", "urgent"]);
      tickets[tid] = {
        id: tid,
        teamId,
        number: ticketNum++,
        subject,
        description: "Customer reported the issue and provided steps to reproduce. Investigating the root cause.",
        status,
        priority,
        requesterId: pick(roster) ?? "user_owner",
        assigneeId: status === "open" ? null : pick(roster) ?? null,
        createdAt: isoAgo(between(0, 21), between(0, 23)),
        updatedAt: isoAgo(between(0, 5), between(0, 23)),
        messages: [
          {
            authorId: pick(roster) ?? "user_owner",
            body: "Hey team — running into this on production today. Can someone take a look?",
            createdAt: isoAgo(between(0, 5)),
          },
        ],
      };
    }
  });

  // Notifications
  const notifications: Record<string, AppNotification> = {};
  const NOTIF_TEMPLATES: Array<Pick<AppNotification, "type" | "title" | "message">> = [
    { type: "task", title: "Task assigned", message: "Sarah Chen assigned you 'Q2 brand refresh — moodboard review'" },
    { type: "mention", title: "You were mentioned", message: "@you can you review the latest mockups by Friday?" },
    { type: "billing", title: "Invoice paid", message: "Your Growth plan invoice for $99.00 was paid successfully." },
    { type: "ticket", title: "Ticket resolved", message: "#1043 'Calendar sync stopped working' was marked resolved" },
    { type: "team", title: "New team member", message: "Priya Patel joined Northwind Marketing" },
    { type: "system", title: "Storage at 78%", message: "You're approaching your 100 GB storage limit." },
    { type: "task", title: "Task moved", message: "'Migrate billing to new system' moved to In Progress" },
    { type: "mention", title: "Comment on your task", message: "Diego Reyes commented on 'Onboarding flow redesign'" },
    { type: "billing", title: "Plan changed", message: "Cobalt Health upgraded to Scale" },
    { type: "ticket", title: "New ticket assigned", message: "#1051 'API timeout on /reports endpoint' was assigned to you" },
  ];

  ["user_admin", "user_owner", "user_member"].forEach((uid) => {
    for (let i = 0; i < 12; i++) {
      const tpl = NOTIF_TEMPLATES[i % NOTIF_TEMPLATES.length];
      const nid = `notif_${uid}_${i}`;
      notifications[nid] = {
        id: nid,
        userId: uid,
        teamId: users[uid].primaryTeamId,
        ...tpl,
        read: i > 4,
        createdAt: isoAgo(Math.floor(i * 0.6), between(0, 23)),
      };
    }
  });

  // Invoices: 6 months per team
  const invoices: Record<string, Invoice> = {};
  Object.values(teams).forEach((team) => {
    const plan = planById(team.plan);
    for (let m = 0; m < 6; m++) {
      const periodStart = new Date();
      periodStart.setMonth(periodStart.getMonth() - m - 1);
      periodStart.setDate(1);
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(0);
      const issuedAt = new Date(periodEnd);
      issuedAt.setDate(issuedAt.getDate() + 1);
      const seatAddon = m < 2 ? between(0, 3) * 1500 : 0;
      const amount = plan.priceCents + seatAddon;
      const iid = `inv_${team.id}_${m}`;
      invoices[iid] = {
        id: iid,
        teamId: team.id,
        number: `INV-${2026000 + (TEAMS_SEED.findIndex((t) => t.id === team.id) * 100) + (6 - m)}`,
        status: m === 0 ? (Math.random() > 0.7 ? "open" : "paid") : "paid",
        amountCents: amount,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        issuedAt: issuedAt.toISOString(),
        paidAt: m === 0 ? null : issuedAt.toISOString(),
        plan: team.plan,
        lineItems: [
          {
            description: `${plan.name} plan — ${periodStart.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
            quantity: 1,
            unitCents: plan.priceCents,
          },
          ...(seatAddon > 0
            ? [{ description: "Additional seats", quantity: seatAddon / 1500, unitCents: 1500 }]
            : []),
        ],
      };
    }
  });

  // Activity feed
  const activity: Record<string, ActivityEvent> = {};
  const ACTIVITY_TEMPLATES = [
    { type: "task_moved" as const, message: " moved 'Onboarding flow redesign' to In Progress" },
    { type: "task_created" as const, message: " created 'Update analytics dashboard'" },
    { type: "comment_added" as const, message: " commented on 'Q2 brand refresh'" },
    { type: "invoice_paid" as const, message: " — invoice INV-2026004 paid" },
    { type: "member_invited" as const, message: " invited Priya Patel to the team" },
    { type: "plan_upgraded" as const, message: " upgraded the team to Growth" },
    { type: "ticket_resolved" as const, message: " resolved #1047 'Calendar sync'" },
    { type: "ticket_assigned" as const, message: " was assigned ticket #1051" },
  ];

  Object.entries(teamRosters).forEach(([teamId, roster]) => {
    for (let i = 0; i < 18; i++) {
      const tpl = ACTIVITY_TEMPLATES[i % ACTIVITY_TEMPLATES.length];
      const aid = `act_${teamId}_${i}`;
      const actor = pick(roster) ?? "user_owner";
      activity[aid] = {
        id: aid,
        teamId,
        actorId: actor,
        type: tpl.type,
        message: tpl.message,
        createdAt: isoAgo(Math.floor(i * 0.4), between(0, 23)),
      };
    }
  });

  // 30-day metrics. Aim for believable trends — not flat, not perfectly linear.
  function build30DayMetrics(scale: number): DailyMetric[] {
    const out: DailyMetric[] = [];
    const baseUsers = scale * 0.7;
    const trend = scale * 0.4;
    for (let d = 29; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const t = (29 - d) / 29;
      const dayOfWeek = date.getDay();
      const weekendMult = dayOfWeek === 0 || dayOfWeek === 6 ? 0.55 : 1;
      const noise = 0.85 + rand() * 0.3;
      const seasonal = 1 + Math.sin(t * Math.PI * 2.3) * 0.08;
      const users = Math.round((baseUsers + trend * t) * noise * weekendMult * seasonal);
      const tasks = Math.round(users * (0.4 + rand() * 0.3));
      const tickets = Math.round(users * (0.05 + rand() * 0.05));
      out.push({
        date: date.toISOString().slice(0, 10),
        activeUsers: users,
        tasksCompleted: tasks,
        ticketsResolved: tickets,
      });
    }
    return out;
  }

  const metrics: Record<string, DailyMetric[]> = {};
  Object.values(teams).forEach((team) => {
    const scale = team.plan === "scale" ? 80 : team.plan === "growth" ? 35 : 12;
    metrics[team.id] = build30DayMetrics(scale);
  });

  const globalMetrics: DailyMetric[] = build30DayMetrics(180);

  return {
    teams,
    users,
    passwords,
    tasks,
    tickets,
    notifications,
    invoices,
    activity,
    metrics,
    globalMetrics,
    session: { userId: null, activeTeamId: null, impersonatorId: null },
  };
}

export const SEED_VERSION = 5;

export function freshSeed(): Database {
  return buildSeed();
}

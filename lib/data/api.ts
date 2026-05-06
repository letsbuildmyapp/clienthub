"use client";

import { store } from "@/lib/mock/store";
import type {
  ActivityEvent,
  AppNotification,
  Invoice,
  PlanId,
  ProjectTask,
  Role,
  Team,
  Ticket,
  User,
} from "@/lib/types";
import { planById } from "@/lib/plans";

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

const now = () => new Date().toISOString();

// ─── auth ──────────────────────────────────────────────────────────────────
export function login(email: string, password: string): User | null {
  const db = store.getSnapshot();
  const lower = email.trim().toLowerCase();
  const user = Object.values(db.users).find((u) => u.email.toLowerCase() === lower);
  if (!user) return null;
  if (db.passwords[user.email] !== password) return null;
  store.update((d) => {
    d.session.userId = user.id;
    d.session.activeTeamId = user.primaryTeamId;
    d.session.impersonatorId = null;
  });
  return user;
}

export function loginAs(userId: string) {
  const db = store.getSnapshot();
  const user = db.users[userId];
  if (!user) return null;
  store.update((d) => {
    d.session.userId = userId;
    d.session.activeTeamId = user.primaryTeamId;
    d.session.impersonatorId = null;
  });
  return user;
}

export function logout() {
  store.update((d) => {
    d.session.userId = null;
    d.session.activeTeamId = null;
    d.session.impersonatorId = null;
  });
}

export function impersonate(userId: string) {
  const db = store.getSnapshot();
  const user = db.users[userId];
  if (!user) return;
  store.update((d) => {
    if (!d.session.impersonatorId) {
      d.session.impersonatorId = d.session.userId;
    }
    d.session.userId = userId;
    d.session.activeTeamId = user.primaryTeamId;
  });
}

export function exitImpersonation() {
  store.update((d) => {
    if (d.session.impersonatorId) {
      const original = d.session.impersonatorId;
      d.session.userId = original;
      d.session.impersonatorId = null;
      const u = d.users[original];
      d.session.activeTeamId = u?.primaryTeamId ?? null;
    }
  });
}

export function signup(opts: {
  email: string;
  password: string;
  name: string;
  teamName: string;
}): User {
  const teamId = genId("team");
  const userId = genId("user");
  const team: Team = {
    id: teamId,
    name: opts.teamName,
    industry: "Custom",
    logoColor: "bg-indigo-600",
    plan: "starter",
    suspended: false,
    billingContact: opts.email,
    createdAt: now(),
    mrrCents: planById("starter").priceCents,
    seatsUsed: 1,
    storageUsedGb: 0,
  };
  const user: User = {
    id: userId,
    email: opts.email,
    name: opts.name,
    title: "Team Owner",
    role: "owner",
    teamIds: [teamId],
    primaryTeamId: teamId,
    avatarColor: "bg-violet-500",
    status: "active",
    joinedAt: now(),
  };
  store.update((d) => {
    d.teams[teamId] = team;
    d.users[userId] = user;
    d.passwords[opts.email] = opts.password;
    d.session.userId = userId;
    d.session.activeTeamId = teamId;
  });
  return user;
}

export function setActiveTeam(teamId: string) {
  store.update((d) => {
    d.session.activeTeamId = teamId;
  });
}

// ─── teams & members ───────────────────────────────────────────────────────
export function inviteMember(teamId: string, email: string, name: string, title: string, role: Role = "member") {
  const userId = genId("user");
  const user: User = {
    id: userId,
    email,
    name,
    title,
    role,
    teamIds: [teamId],
    primaryTeamId: teamId,
    avatarColor: ["bg-rose-500", "bg-amber-500", "bg-cyan-500", "bg-fuchsia-500"][Math.floor(Math.random() * 4)],
    status: "invited",
    joinedAt: now(),
  };
  store.update((d) => {
    d.users[userId] = user;
    d.passwords[email] = "demo1234";
    d.teams[teamId].seatsUsed += 1;
    addNotificationDirect(d, {
      userId: d.teams[teamId] && Object.values(d.users).find((u) => u.teamIds.includes(teamId) && u.role === "owner")?.id || "",
      teamId,
      type: "team",
      title: "New invite sent",
      message: `Invitation sent to ${email}`,
      read: false,
      actorId: d.session.userId ?? undefined,
    });
    addActivityDirect(d, {
      teamId,
      actorId: d.session.userId ?? "user_owner",
      type: "member_invited",
      message: ` invited ${name} to the team`,
    });
  });
  return user;
}

export function removeMember(teamId: string, userId: string) {
  store.update((d) => {
    const u = d.users[userId];
    if (!u) return;
    u.teamIds = u.teamIds.filter((t) => t !== teamId);
    if (u.teamIds.length === 0) {
      delete d.users[userId];
    } else {
      u.primaryTeamId = u.teamIds[0];
    }
    if (d.teams[teamId]) {
      d.teams[teamId].seatsUsed = Math.max(0, d.teams[teamId].seatsUsed - 1);
    }
  });
}

export function changeMemberRole(userId: string, role: Role) {
  store.update((d) => {
    if (d.users[userId]) d.users[userId].role = role;
  });
}

export function updateTeam(teamId: string, patch: Partial<Pick<Team, "name" | "billingContact" | "logoColor" | "industry">>) {
  store.update((d) => {
    if (d.teams[teamId]) Object.assign(d.teams[teamId], patch);
  });
}

export function suspendTeam(teamId: string, suspended: boolean) {
  store.update((d) => {
    if (d.teams[teamId]) d.teams[teamId].suspended = suspended;
  });
}

// ─── tasks ──────────────────────────────────────────────────────────────────
export function moveTask(taskId: string, status: ProjectTask["status"], orderHint?: number) {
  store.update((d) => {
    const t = d.tasks[taskId];
    if (!t) return;
    const prev = t.status;
    t.status = status;
    if (orderHint != null) t.order = orderHint;
    if (prev !== status) {
      addActivityDirect(d, {
        teamId: t.teamId,
        actorId: d.session.userId ?? "user_owner",
        type: "task_moved",
        message: ` moved '${t.title}' to ${status === "todo" ? "To Do" : status === "in_progress" ? "In Progress" : "Done"}`,
        targetId: taskId,
      });
    }
  });
}

export function createTask(teamId: string, title: string, status: ProjectTask["status"] = "todo", priority: ProjectTask["priority"] = "medium") {
  const id = genId("task");
  const t: ProjectTask = {
    id,
    teamId,
    title,
    description: "",
    status,
    priority,
    assigneeId: null,
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    createdAt: now(),
    order: Date.now(),
    tags: [],
  };
  store.update((d) => {
    d.tasks[id] = t;
    addActivityDirect(d, {
      teamId,
      actorId: d.session.userId ?? "user_owner",
      type: "task_created",
      message: ` created '${title}'`,
    });
  });
  return t;
}

export function updateTask(taskId: string, patch: Partial<ProjectTask>) {
  store.update((d) => {
    if (d.tasks[taskId]) Object.assign(d.tasks[taskId], patch);
  });
}

export function deleteTask(taskId: string) {
  store.update((d) => {
    delete d.tasks[taskId];
  });
}

// ─── tickets ────────────────────────────────────────────────────────────────
export function updateTicket(id: string, patch: Partial<Ticket>) {
  store.update((d) => {
    if (d.tickets[id]) {
      Object.assign(d.tickets[id], patch, { updatedAt: now() });
    }
  });
}

export function createTicket(opts: {
  teamId: string;
  subject: string;
  description: string;
  priority: Ticket["priority"];
  requesterId: string;
  assigneeId: string | null;
}): Ticket {
  const id = genId("ticket");
  const number = nextTicketNumber();
  const created = now();
  const ticket: Ticket = {
    id,
    teamId: opts.teamId,
    number,
    subject: opts.subject,
    description: opts.description,
    status: opts.assigneeId ? "in_progress" : "open",
    priority: opts.priority,
    requesterId: opts.requesterId,
    assigneeId: opts.assigneeId,
    createdAt: created,
    updatedAt: created,
    messages: [],
  };
  store.update((d) => {
    d.tickets[id] = ticket;
    if (opts.assigneeId) {
      addNotificationDirect(d, {
        userId: opts.assigneeId,
        teamId: opts.teamId,
        type: "ticket",
        title: "New ticket assigned",
        message: `#${number} '${opts.subject}' was assigned to you`,
        read: false,
      });
    }
  });
  return ticket;
}

function nextTicketNumber(): number {
  const tickets = Object.values(store.getSnapshot().tickets);
  return tickets.reduce((max, t) => Math.max(max, t.number), 1042) + 1;
}

// ─── billing ────────────────────────────────────────────────────────────────
export function changePlan(teamId: string, newPlan: PlanId) {
  store.update((d) => {
    const team = d.teams[teamId];
    if (!team) return;
    const prevPlan = team.plan;
    team.plan = newPlan;
    team.mrrCents = planById(newPlan).priceCents;
    addActivityDirect(d, {
      teamId,
      actorId: d.session.userId ?? "user_owner",
      type: "plan_upgraded",
      message: ` ${planRank(newPlan) > planRank(prevPlan) ? "upgraded" : "changed"} the team to ${planById(newPlan).name}`,
    });
    const owner = Object.values(d.users).find((u) => u.teamIds.includes(teamId) && u.role === "owner");
    if (owner) {
      addNotificationDirect(d, {
        userId: owner.id,
        teamId,
        type: "billing",
        title: "Plan changed",
        message: `Plan changed to ${planById(newPlan).name} ($${planById(newPlan).priceCents / 100}/mo)`,
        read: false,
      });
    }
  });
}

function planRank(p: PlanId) {
  return p === "starter" ? 1 : p === "growth" ? 2 : 3;
}

export function payInvoice(invoiceId: string) {
  store.update((d) => {
    const inv = d.invoices[invoiceId];
    if (!inv) return;
    inv.status = "paid";
    inv.paidAt = now();
    const owner = Object.values(d.users).find((u) => u.teamIds.includes(inv.teamId) && u.role === "owner");
    if (owner) {
      addNotificationDirect(d, {
        userId: owner.id,
        teamId: inv.teamId,
        type: "billing",
        title: "Invoice paid",
        message: `Invoice ${inv.number} for $${(inv.amountCents / 100).toFixed(2)} was paid.`,
        read: false,
      });
    }
  });
}

// ─── notifications ──────────────────────────────────────────────────────────
function addNotificationDirect(
  d: ReturnType<typeof store.getSnapshot>,
  partial: Omit<AppNotification, "id" | "createdAt">,
) {
  if (!partial.userId) return;
  const id = genId("notif");
  d.notifications[id] = { ...partial, id, createdAt: now() };
}

function addActivityDirect(
  d: ReturnType<typeof store.getSnapshot>,
  partial: Omit<ActivityEvent, "id" | "createdAt">,
) {
  const id = genId("act");
  d.activity[id] = { ...partial, id, createdAt: now() };
}

export function markNotificationRead(id: string, read = true) {
  store.update((d) => {
    if (d.notifications[id]) d.notifications[id].read = read;
  });
}

export function markAllNotificationsRead(userId: string) {
  store.update((d) => {
    Object.values(d.notifications).forEach((n) => {
      if (n.userId === userId) n.read = true;
    });
  });
}

export function addNotification(partial: Omit<AppNotification, "id" | "createdAt" | "read"> & { read?: boolean }) {
  if (!partial.userId) return;
  store.update((d) => {
    addNotificationDirect(d, { read: false, ...partial });
  });
}

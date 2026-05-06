export type Role = "admin" | "owner" | "member";

export type PlanId = "starter" | "growth" | "scale";

export type Plan = {
  id: PlanId;
  name: string;
  priceCents: number;
  description: string;
  features: string[];
  limits: {
    seats: number;
    projects: number;
    storageGb: number;
  };
};

export type Team = {
  id: string;
  name: string;
  industry: string;
  logoColor: string;
  plan: PlanId;
  suspended: boolean;
  billingContact: string;
  createdAt: string;
  // Aggregate counters used by the admin view; updated on actions.
  mrrCents: number;
  seatsUsed: number;
  storageUsedGb: number;
};

export type User = {
  id: string;
  email: string;
  name: string;
  title: string;
  role: Role;
  teamIds: string[];
  primaryTeamId: string | null;
  avatarColor: string;
  status: "active" | "invited" | "suspended";
  joinedAt: string;
};

export type TaskStatus = "todo" | "in_progress" | "done";
export type Priority = "low" | "medium" | "high" | "urgent";

export type ProjectTask = {
  id: string;
  teamId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assigneeId: string | null;
  dueDate: string;
  createdAt: string;
  order: number;
  tags: string[];
};

export type TicketStatus = "open" | "in_progress" | "waiting" | "resolved" | "closed";

export type Ticket = {
  id: string;
  teamId: string;
  number: number;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  requesterId: string;
  assigneeId: string | null;
  createdAt: string;
  updatedAt: string;
  messages: { authorId: string; body: string; createdAt: string }[];
};

export type NotificationType =
  | "mention"
  | "billing"
  | "system"
  | "task"
  | "ticket"
  | "team";

export type AppNotification = {
  id: string;
  userId: string;
  teamId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actorId?: string;
  link?: string;
};

export type Invoice = {
  id: string;
  teamId: string;
  number: string;
  status: "paid" | "open" | "void";
  amountCents: number;
  periodStart: string;
  periodEnd: string;
  issuedAt: string;
  paidAt: string | null;
  plan: PlanId;
  lineItems: { description: string; quantity: number; unitCents: number }[];
};

export type ActivityEvent = {
  id: string;
  teamId: string;
  actorId: string;
  type:
    | "task_moved"
    | "task_created"
    | "comment_added"
    | "invoice_paid"
    | "member_invited"
    | "plan_upgraded"
    | "ticket_resolved"
    | "ticket_assigned";
  message: string;
  targetId?: string;
  createdAt: string;
};

export type DailyMetric = {
  date: string; // YYYY-MM-DD
  activeUsers: number;
  tasksCompleted: number;
  ticketsResolved: number;
};

export type Database = {
  teams: Record<string, Team>;
  users: Record<string, User>;
  passwords: Record<string, string>; // email -> password (mock only)
  tasks: Record<string, ProjectTask>;
  tickets: Record<string, Ticket>;
  notifications: Record<string, AppNotification>;
  invoices: Record<string, Invoice>;
  activity: Record<string, ActivityEvent>;
  metrics: Record<string, DailyMetric[]>; // teamId -> 30 days
  globalMetrics: DailyMetric[];
  session: { userId: string | null; activeTeamId: string | null; impersonatorId: string | null };
};

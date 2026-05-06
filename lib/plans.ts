import type { Plan } from "./types";

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceCents: 2900,
    description: "Everything a small team needs to get started.",
    features: [
      "Up to 5 team members",
      "20 active projects",
      "10 GB file storage",
      "Email support",
      "Standard analytics",
    ],
    limits: { seats: 5, projects: 20, storageGb: 10 },
  },
  {
    id: "growth",
    name: "Growth",
    priceCents: 9900,
    description: "For growing teams that need more power and visibility.",
    features: [
      "Up to 25 team members",
      "Unlimited projects",
      "100 GB file storage",
      "Priority support",
      "Advanced analytics & exports",
      "Custom roles & permissions",
    ],
    limits: { seats: 25, projects: 999, storageGb: 100 },
  },
  {
    id: "scale",
    name: "Scale",
    priceCents: 29900,
    description: "Enterprise-grade tooling with dedicated support.",
    features: [
      "Unlimited team members",
      "Unlimited projects",
      "1 TB file storage",
      "24/7 priority support",
      "SSO + SCIM provisioning",
      "Audit log & compliance reports",
      "Dedicated success manager",
    ],
    limits: { seats: 999, projects: 9999, storageGb: 1024 },
  },
];

export function planById(id: string): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

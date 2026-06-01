export const planCatalog = {
  starter: { monthly: 10, proposalLimit: 40, memberLimit: 3 },
  growth: { monthly: 29, proposalLimit: 300, memberLimit: 20 },
  enterprise: { monthly: 99, proposalLimit: 5000, memberLimit: 200 }
} as const;

export type PlanName = keyof typeof planCatalog;

export type PlanLimits = (typeof planCatalog)[PlanName];

export function isPaidPlan(plan: string): plan is PlanName {
  return plan in planCatalog;
}

export function isSubscriptionActive(status: string) {
  return status === "active" || status === "trialing";
}

export function getPlanLimits(plan: string): PlanLimits | null {
  if (!isPaidPlan(plan)) return null;
  return planCatalog[plan];
}

/** Inizio periodo di fatturazione corrente (mese solare UTC). */
export function currentBillingPeriodStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

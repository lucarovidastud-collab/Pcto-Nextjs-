export const planCatalog = {
  starter: { monthly: 10, proposalLimit: 40, memberLimit: 3 },
  growth: { monthly: 29, proposalLimit: 300, memberLimit: 20 },
  enterprise: { monthly: 99, proposalLimit: 5000, memberLimit: 200 }
} as const;

export type PlanName = keyof typeof planCatalog;

export function getPlanLimits(plan: string) {
  return planCatalog[(plan as PlanName) || "starter"] || planCatalog.starter;
}

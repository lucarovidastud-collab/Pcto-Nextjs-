import { planCatalog, type PlanName } from "@/lib/billing/plans";

export const adminAssignablePlans = ["none", "starter", "growth", "enterprise"] as const;
export type AdminAssignablePlan = (typeof adminAssignablePlans)[number];

export function isAdminAssignablePlan(value: string): value is AdminAssignablePlan {
  return (adminAssignablePlans as readonly string[]).includes(value);
}

export function statusForAdminPlan(plan: AdminAssignablePlan): string {
  return plan === "none" ? "canceled" : "active";
}

export function planMonthlyLabel(plan: AdminAssignablePlan): string | null {
  if (plan === "none") return null;
  return `€${planCatalog[plan as PlanName].monthly}`;
}

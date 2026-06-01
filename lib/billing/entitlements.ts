import {
  countTenantProposalsSince,
  getSubscriptionForTenant
} from "@/lib/db/repositories";
import {
  currentBillingPeriodStart,
  getPlanLimits,
  isPaidPlan,
  isSubscriptionActive,
  type PlanName
} from "@/lib/billing/plans";

export type ProposalAccessDenied =
  | { code: "subscription_required" }
  | { code: "proposal_limit_reached"; used: number; limit: number; plan: PlanName };

export type ProposalAccessResult =
  | { allowed: true; plan: PlanName; used: number; limit: number }
  | { allowed: false; error: ProposalAccessDenied };

export async function getProposalUsage(tenantId: string) {
  const periodStart = currentBillingPeriodStart();
  const used = await countTenantProposalsSince(tenantId, periodStart);
  return { used, periodStart };
}

export async function assertCanCreateProposal(tenantId: string): Promise<ProposalAccessResult> {
  const sub = await getSubscriptionForTenant(tenantId);

  if (!isPaidPlan(sub.plan) || !isSubscriptionActive(sub.status)) {
    return { allowed: false, error: { code: "subscription_required" } };
  }

  const limits = getPlanLimits(sub.plan)!;
  const { used } = await getProposalUsage(tenantId);

  if (used >= limits.proposalLimit) {
    return {
      allowed: false,
      error: {
        code: "proposal_limit_reached",
        used,
        limit: limits.proposalLimit,
        plan: sub.plan
      }
    };
  }

  return { allowed: true, plan: sub.plan, used, limit: limits.proposalLimit };
}

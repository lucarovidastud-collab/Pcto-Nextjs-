import { describe, expect, it, vi, beforeEach } from "vitest";
import { assertCanCreateProposal } from "@/lib/billing/entitlements";
import * as repositories from "@/lib/db/repositories";

vi.mock("@/lib/db/repositories", () => ({
  getSubscriptionForTenant: vi.fn(),
  countTenantProposalsSince: vi.fn()
}));

describe("assertCanCreateProposal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("denies when no active subscription", async () => {
    vi.mocked(repositories.getSubscriptionForTenant).mockResolvedValue({
      plan: "none",
      status: "inactive",
      stripeCustomerId: ""
    });

    const result = await assertCanCreateProposal("ten_test");
    expect(result).toEqual({ allowed: false, error: { code: "subscription_required" } });
  });

  it("denies when monthly proposal limit reached", async () => {
    vi.mocked(repositories.getSubscriptionForTenant).mockResolvedValue({
      plan: "starter",
      status: "active",
      stripeCustomerId: "cus_x"
    });
    vi.mocked(repositories.countTenantProposalsSince).mockResolvedValue(40);

    const result = await assertCanCreateProposal("ten_test");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.error).toEqual({
        code: "proposal_limit_reached",
        used: 40,
        limit: 40,
        plan: "starter"
      });
    }
  });

  it("allows when under limit", async () => {
    vi.mocked(repositories.getSubscriptionForTenant).mockResolvedValue({
      plan: "starter",
      status: "active",
      stripeCustomerId: "cus_x"
    });
    vi.mocked(repositories.countTenantProposalsSince).mockResolvedValue(39);

    const result = await assertCanCreateProposal("ten_test");
    expect(result).toEqual({ allowed: true, plan: "starter", used: 39, limit: 40 });
  });
});

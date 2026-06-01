import { describe, expect, it } from "vitest";
import { getPlanLimits, isPaidPlan } from "@/lib/billing/plans";

describe("getPlanLimits", () => {
  it("returns null for no plan", () => {
    expect(getPlanLimits("none")).toBeNull();
    expect(getPlanLimits("unknown")).toBeNull();
  });

  it("returns limits for paid plans", () => {
    expect(getPlanLimits("starter")?.proposalLimit).toBe(40);
  });
});

describe("isPaidPlan", () => {
  it("recognizes catalog plans", () => {
    expect(isPaidPlan("growth")).toBe(true);
    expect(isPaidPlan("none")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { isAdminAssignablePlan, statusForAdminPlan } from "./subscription-plans";

describe("admin subscription plans", () => {
  it("accepts known plans", () => {
    expect(isAdminAssignablePlan("growth")).toBe(true);
    expect(isAdminAssignablePlan("invalid")).toBe(false);
  });

  it("maps gift plans to active and none to canceled", () => {
    expect(statusForAdminPlan("enterprise")).toBe("active");
    expect(statusForAdminPlan("none")).toBe("canceled");
  });
});

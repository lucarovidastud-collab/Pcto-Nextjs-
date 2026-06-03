import { describe, expect, it, afterEach } from "vitest";
import {
  getDatabaseProvider,
  getRepository,
  resetRepositoryForTests
} from "@/lib/db/get-repository";
describe("getRepository", () => {
  afterEach(() => {
    resetRepositoryForTests();
    delete process.env.DATABASE_PROVIDER;
  });

  it("defaults to firestore provider", () => {
    expect(getDatabaseProvider()).toBe("firestore");
    const repo = getRepository();
    expect(typeof repo.createProposal).toBe("function");
    expect(typeof repo.listAllTenantsWithDetails).toBe("function");
  });

  it("selects mongodb when DATABASE_PROVIDER=mongodb", () => {
    process.env.DATABASE_PROVIDER = "mongodb";
    resetRepositoryForTests();
    expect(getDatabaseProvider()).toBe("mongodb");
    expect(() => getRepository().getSubscriptionForTenant("ten_x")).toThrow(/not implemented/i);
  });
});

import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("rate limit", () => {
  it("blocks when token bucket is empty", () => {
    const key = `test-${Date.now()}`;
    expect(checkRateLimit(key, 2, 1000)).toBe(true);
    expect(checkRateLimit(key, 2, 1000)).toBe(true);
    expect(checkRateLimit(key, 2, 1000)).toBe(false);
  });
});

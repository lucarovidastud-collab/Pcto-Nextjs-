import { describe, expect, it } from "vitest";
import { readableBrandOnSurface } from "@/lib/proposals/brand-theme";

describe("readableBrandOnSurface", () => {
  it("keeps saturated brand colors when contrast is sufficient", () => {
    expect(readableBrandOnSurface("#0D9488")).toBe("#0d9488");
  });

  it("darkens very light brand colors for light proposal backgrounds", () => {
    const result = readableBrandOnSurface("#E8E8E8");
    expect(result.toLowerCase()).not.toBe("#e8e8e8");
    expect(result).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("darkens white brand on white header surface", () => {
    const result = readableBrandOnSurface("#FFFFFF", "#ffffff");
    expect(result.toLowerCase()).not.toBe("#ffffff");
  });
});

import { describe, expect, it } from "vitest";
import { normalizePaletteHex, sanitizePaletteInput } from "@/lib/utils/palette";

describe("palette utils", () => {
  it("normalizes 3 and 6 digit hex", () => {
    expect(normalizePaletteHex("#abc")).toBe("#AABBCC");
    expect(normalizePaletteHex("0d9488")).toBe("#0D9488");
  });

  it("dedupes and caps palette length", () => {
    expect(sanitizePaletteInput(["#0D9488", "#0D9488", "#8B5CF6"])).toEqual([
      "#0D9488",
      "#8B5CF6"
    ]);
  });
});

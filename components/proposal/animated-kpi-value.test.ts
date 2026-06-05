import { describe, expect, it } from "vitest";

function parseNumericKpi(text: string) {
  const trimmed = text.trim();
  const numMatch = trimmed.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/);
  if (!numMatch) return null;

  const numStr = numMatch[1];
  const idx = numMatch.index ?? 0;
  const prefix = trimmed.slice(0, idx);
  const suffix = trimmed.slice(idx + numStr.length);
  const normalized = numStr.replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  if (!Number.isFinite(number)) return null;

  return { prefix, number, suffix, hasDecimals: numStr.includes(",") };
}

describe("parseNumericKpi", () => {
  it("parses euro amounts with thousand separators", () => {
    expect(parseNumericKpi("€ 47.000")).toEqual({
      prefix: "€ ",
      number: 47000,
      suffix: "",
      hasDecimals: false
    });
  });

  it("parses budget fallback style", () => {
    expect(parseNumericKpi("€ 4.200")?.number).toBe(4200);
  });

  it("parses plain integers", () => {
    expect(parseNumericKpi("3")?.number).toBe(3);
  });
});

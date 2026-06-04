import { describe, expect, it } from "vitest";
import {
  extractExplicitTotalFromNotes,
  isReasonableBudget,
  parseItalianAmount
} from "./budget-from-notes";

describe("parseItalianAmount", () => {
  it("parses European thousands separator", () => {
    expect(parseItalianAmount("47.000")).toBe(47000);
    expect(parseItalianAmount("15.000,50")).toBe(15000.5);
  });

  it("rejects absurd values", () => {
    expect(parseItalianAmount("3.905.471.740.020")).toBeNull();
    expect(isReasonableBudget(3_905_471_740_020)).toBe(false);
  });
});

describe("extractExplicitTotalFromNotes", () => {
  it("reads only explicit total labels", () => {
    const notes = "Preventivo King Inox\nImporto totale: 47.000 €\nTel 02 1234567";
    expect(extractExplicitTotalFromNotes(notes)).toBe(47000);
  });

  it("ignores random numbers without total label", () => {
    const notes = "Budget stimato 22.875 EUR\nCodice 3905471740020";
    expect(extractExplicitTotalFromNotes(notes)).toBeNull();
  });
});

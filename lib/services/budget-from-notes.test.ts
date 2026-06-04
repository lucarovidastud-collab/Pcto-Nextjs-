import { describe, expect, it } from "vitest";
import { extractBudgetFromNotes, parseItalianAmount } from "./budget-from-notes";

describe("parseItalianAmount", () => {
  it("parses European thousands separator", () => {
    expect(parseItalianAmount("47.000")).toBe(47000);
    expect(parseItalianAmount("15.000,50")).toBe(15000.5);
  });

  it("parses plain integers", () => {
    expect(parseItalianAmount("22875")).toBe(22875);
  });

  it("rejects absurd dot chains from PDF noise", () => {
    expect(parseItalianAmount("3.905.471.740.020")).toBeNull();
    expect(parseItalianAmount("3905471740020")).toBeNull();
  });
});

describe("extractBudgetFromNotes", () => {
  it("finds totale with Italian formatting", () => {
    const notes = "Preventivo King Inox\nImporto totale: 47.000 €\nValidità 30 giorni";
    expect(extractBudgetFromNotes(notes)).toBe(47000);
  });

  it("prefers totale line over random numbers", () => {
    const notes = "Rif OF25097.1\nTotale generale 15.000 euro\nPartenza 2026";
    expect(extractBudgetFromNotes(notes)).toBe(15000);
  });

  it("finds amount before euro symbol", () => {
    expect(extractBudgetFromNotes("Budget stimato 22.875 EUR IVA esclusa")).toBe(22875);
  });

  it("accepts small and large realistic totals", () => {
    expect(extractBudgetFromNotes("Importo totale: 800 €")).toBe(800);
    expect(extractBudgetFromNotes("Totale progetto 1.250.000 euro")).toBe(1250000);
  });

  it("does not merge PDF digit soup into trillions", () => {
    const notes =
      "Importo totale 47.000 €\n" +
      "codice 3905471740020\n" +
      "rumore 3.905.471.740.020";
    expect(extractBudgetFromNotes(notes)).toBe(47000);
  });
});

import { describe, expect, it } from "vitest";
import {
  fixExcessiveTitleCase,
  fixItalianParticlesCase,
  normalizeItalianTypography,
  unwrapInlineEmphasis
} from "./normalize-typography";

describe("unwrapInlineEmphasis", () => {
  it("removes strong tags", () => {
    expect(unwrapInlineEmphasis("<p>Testo <strong>grassetto</strong> fine</p>")).toBe(
      "<p>Testo grassetto fine</p>"
    );
  });
});

describe("fixExcessiveTitleCase", () => {
  it("demotes caps after the first word in a run", () => {
    expect(fixExcessiveTitleCase("Gamma Prodotti Tutti i")).toBe("Gamma prodotti tutti i");
  });
});

describe("fixItalianParticlesCase", () => {
  it("lowercases capitalized particles", () => {
    expect(fixItalianParticlesCase("catalogo Dei prodotti")).toBe("catalogo dei prodotti");
  });
});

describe("normalizeItalianTypography", () => {
  it("combines spacing and capitalization fixes", () => {
    expect(normalizeItalianTypography("Gamma Prodotti Tutti I articoli")).toBe(
      "Gamma prodotti tutti i articoli"
    );
  });
});

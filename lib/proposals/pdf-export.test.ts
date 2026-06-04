import { describe, expect, it } from "vitest";
import { htmlToPlainTextForPdf, normalizePdfText } from "./pdf-export";

describe("normalizePdfText", () => {
  it("replaces smart quotes and bullets with ASCII-safe chars", () => {
    const input = "l\u2019applicazione \u2022 fase 1 \u2014 totale \u20AC 1000";
    expect(normalizePdfText(input)).toBe("l'applicazione - fase 1 - totale EUR 1000");
  });
});

describe("htmlToPlainTextForPdf", () => {
  it("strips tags and keeps readable structure", () => {
    const html = `<section><h3>Team</h3><ul><li>Project Manager</li><li>UX Specialist</li></ul></section>`;
    const text = htmlToPlainTextForPdf(html);
    expect(text).toContain("Team");
    expect(text).toContain("- Project Manager");
    expect(text).not.toContain("<");
  });
});

import { describe, expect, it } from "vitest";
import { buildCsvTable, truncateForCsv } from "./csv";

describe("buildCsvTable", () => {
  it("uses UTF-8 BOM and semicolon delimiter for Excel EU", () => {
    const csv = buildCsvTable([
      ["ID", "Azienda"],
      ["prop_1", "King Inox"]
    ]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("ID;Azienda");
    expect(csv).toContain("prop_1;King Inox");
  });

  it("quotes cells with delimiter or quotes", () => {
    const csv = buildCsvTable([["Note"], ['testo con "virgolette" e; punto e virgola']]);
    expect(csv).toContain('"testo con ""virgolette"" e; punto e virgola"');
  });
});

describe("truncateForCsv", () => {
  it("shortens long sector descriptions", () => {
    const long = "a".repeat(200);
    expect(truncateForCsv(long, 120).length).toBeLessThanOrEqual(120);
  });
});

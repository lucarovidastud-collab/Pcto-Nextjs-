const DEFAULT_DELIMITER = ";";

/** Excel (IT/EU) apre correttamente UTF-8 con BOM e separatore punto e virgola. */
export function buildCsvTable(rows: string[][], delimiter = DEFAULT_DELIMITER): string {
  const lines = rows.map((row) =>
    row.map((cell) => escapeCsvCell(String(cell ?? ""), delimiter)).join(delimiter)
  );
  return `\uFEFF${lines.join("\r\n")}`;
}

function escapeCsvCell(value: string, delimiter: string): string {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n+/g, " ").trim();
  const mustQuote =
    normalized.includes(delimiter) ||
    normalized.includes('"') ||
    normalized.includes("\n") ||
    /^\s|\s$/.test(normalized);

  if (!mustQuote) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function truncateForCsv(text: string, max = 120): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trim()}…`;
}

export function formatCsvDate(iso: string | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatCsvBudget(amount: number): string {
  if (!Number.isFinite(amount)) return "0";
  return String(Math.round(amount));
}

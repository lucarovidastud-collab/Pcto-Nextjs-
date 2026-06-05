import { z } from "zod";

const kpiSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1)
});

const listItemSchema = z.object({
  lead: z.string().optional(),
  body: z.string().min(1)
});

const timelineStepSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1)
});

const pricingRowSchema = z.object({
  description: z.string().min(1),
  amount: z.string().optional()
});

const cardSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1)
});

export const proposalSectionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("hero"), title: z.string().min(1), lead: z.string().min(1) }),
  z.object({ type: z.literal("kpis"), items: z.array(kpiSchema).min(2).max(6) }),
  z.object({
    type: z.literal("text"),
    title: z.string().min(1),
    paragraphs: z.array(z.string().min(1)).min(1)
  }),
  z.object({
    type: z.literal("list"),
    title: z.string().min(1),
    items: z.array(listItemSchema).min(1)
  }),
  z.object({
    type: z.literal("timeline"),
    title: z.string().min(1),
    steps: z.array(timelineStepSchema).min(2)
  }),
  z.object({
    type: z.literal("pricing"),
    title: z.string().min(1),
    rows: z.array(pricingRowSchema).min(1)
  }),
  z.object({
    type: z.literal("highlight"),
    title: z.string().min(1),
    items: z.array(z.string().min(1)).min(1)
  }),
  z.object({
    type: z.literal("grid"),
    title: z.string().min(1),
    cards: z.array(cardSchema).min(2)
  })
]);

export const proposalDocumentSchema = z.object({
  version: z.literal(1),
  sections: z.array(proposalSectionSchema).min(4)
});

export type ProposalDocument = z.infer<typeof proposalDocumentSchema>;
export type ProposalDocumentSection = z.infer<typeof proposalSectionSchema>;

export type ProposalNavSection = { id: string; title: string };

function coerceSection(raw: unknown): ProposalDocumentSection | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const type = String(obj.type || "").toLowerCase();

  if (type === "hero" && obj.title && obj.lead) {
    return {
      type: "hero",
      title: String(obj.title),
      lead: String(obj.lead || obj.subtitle || "")
    };
  }

  if (type === "kpis" && Array.isArray(obj.items)) {
    const items = obj.items
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const value = String(row.value || row.amount || "").trim();
        const label = String(row.label || row.title || "").trim();
        if (!value || !label) return null;
        return { value, label };
      })
      .filter(Boolean) as Array<{ value: string; label: string }>;
    if (items.length >= 2) return { type: "kpis", items };
  }

  if (type === "text" && obj.title) {
    const paragraphs = Array.isArray(obj.paragraphs)
      ? obj.paragraphs.map((p) => String(p).trim()).filter(Boolean)
      : obj.body
        ? [String(obj.body)]
        : [];
    if (paragraphs.length) return { type: "text", title: String(obj.title), paragraphs };
  }

  if (type === "list" && obj.title && Array.isArray(obj.items)) {
    const items = obj.items
      .map((item) => {
        if (typeof item === "string") return { body: item.trim() };
        if (!item || typeof item !== "object") return null;
        const row = item as Record<string, unknown>;
        const body = String(row.body || row.text || "").trim();
        const lead = row.lead ? String(row.lead).trim() : undefined;
        if (!body) return null;
        return lead ? { lead, body } : { body };
      })
      .filter(Boolean) as Array<{ lead?: string; body: string }>;
    if (items.length) return { type: "list", title: String(obj.title), items };
  }

  if (type === "timeline" && obj.title && Array.isArray(obj.steps)) {
    const steps = obj.steps
      .map((step) => {
        if (!step || typeof step !== "object") return null;
        const row = step as Record<string, unknown>;
        const title = String(row.title || "").trim();
        const description = String(row.description || row.body || "").trim();
        if (!title || !description) return null;
        return { title, description };
      })
      .filter(Boolean) as Array<{ title: string; description: string }>;
    if (steps.length >= 2) return { type: "timeline", title: String(obj.title), steps };
  }

  if (type === "pricing" && obj.title && Array.isArray(obj.rows)) {
    const rows = obj.rows
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const r = row as Record<string, unknown>;
        const description = String(r.description || r.label || "").trim();
        if (!description) return null;
        const amount = r.amount ? String(r.amount).trim() : undefined;
        return amount ? { description, amount } : { description };
      })
      .filter(Boolean) as Array<{ description: string; amount?: string }>;
    if (rows.length) return { type: "pricing", title: String(obj.title), rows };
  }

  if (type === "highlight" && obj.title) {
    const items = Array.isArray(obj.items)
      ? obj.items.map((i) => String(i).trim()).filter(Boolean)
      : [];
    if (items.length) return { type: "highlight", title: String(obj.title), items };
  }

  if (type === "grid" && obj.title && Array.isArray(obj.cards)) {
    const cards = obj.cards
      .map((card) => {
        if (!card || typeof card !== "object") return null;
        const c = card as Record<string, unknown>;
        const title = String(c.title || "").trim();
        const body = String(c.body || c.text || "").trim();
        if (!title || !body) return null;
        return { title, body };
      })
      .filter(Boolean) as Array<{ title: string; body: string }>;
    if (cards.length >= 2) return { type: "grid", title: String(obj.title), cards };
  }

  return null;
}

export function parseProposalDocumentJson(text: string): ProposalDocument | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;
  const match = candidate.match(/\{[\s\S]*\}/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]) as unknown;
    const strict = proposalDocumentSchema.safeParse(parsed);
    if (strict.success) return strict.data;

    if (!parsed || typeof parsed !== "object") return null;
    const root = parsed as Record<string, unknown>;
    const rawSections = Array.isArray(root.sections) ? root.sections : [];
    const sections = rawSections.map(coerceSection).filter(Boolean) as ProposalDocumentSection[];
    if (sections.length < 4) return null;

    const loose = proposalDocumentSchema.safeParse({ version: 1, sections });
    return loose.success ? loose.data : null;
  } catch {
    return null;
  }
}

export function ensureDocumentPricingTotal(document: ProposalDocument, budget: number): ProposalDocument {
  const formatted = `€ ${Math.round(budget).toLocaleString("it-IT")}`;
  const sections = document.sections.map((section) => {
    if (section.type !== "pricing") return section;
    const rows = section.rows.filter((row) => !/^totale\b/i.test(row.description));
    return {
      ...section,
      rows: [...rows, { description: "Totale investimento", amount: formatted }]
    };
  });
  return { version: 1, sections };
}

export function normalizeProposalDocument(document: ProposalDocument, budget: number): ProposalDocument {
  return ensureDocumentPricingTotal(document, budget);
}

export function documentNavSections(document: ProposalDocument): ProposalNavSection[] {
  const sections: ProposalNavSection[] = [];
  let index = 0;

  for (const section of document.sections) {
    if (section.type === "hero" || section.type === "kpis") continue;
    const title =
      "title" in section && section.title
        ? section.title.length > 72
          ? `${section.title.slice(0, 72).trim()}…`
          : section.title
        : "";
    if (!title) continue;
    index += 1;
    sections.push({ id: `sezione-${index}`, title });
  }

  return sections;
}

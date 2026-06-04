import { resolveNotesFromUploadedFile } from "@/lib/services/source-notes";
import { createProposalSchema } from "@/lib/validators";
import { DEFAULT_PROPOSAL_STYLE, isProposalStyleId, type ProposalStyleId } from "@/lib/proposals/styles";

export type ParsedProposalForm = {
  company: string;
  website: string;
  sector: string;
  palette: string[];
  notes: string;
  linkSlug: string;
  style: ProposalStyleId;
};

function parseStyle(value: string): ProposalStyleId {
  const trimmed = value.trim();
  return isProposalStyleId(trimmed) ? trimmed : DEFAULT_PROPOSAL_STYLE;
}

export function parsePalette(value: string) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.map((v) => String(v).toUpperCase());
    }
  } catch {
    // ignore
  }
  return [];
}

export async function parseProposalRequest(request: Request): Promise<
  | { ok: true; data: ParsedProposalForm }
  | { ok: false; status: number; error: string }
> {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const company = String(form.get("company") || "").trim();
    const website = String(form.get("website") || "").trim();
    const sector = String(form.get("sector") || "").trim();
    const linkSlug = String(form.get("linkSlug") || "").trim();
    const style = parseStyle(String(form.get("style") || ""));
    const palette = parsePalette(String(form.get("palette") || "[]"));

    const files = [...form.getAll("files"), form.get("file")].filter((entry): entry is File => entry instanceof File);
    if (files.length === 0) {
      return { ok: false, status: 400, error: "File mancante" };
    }

    let notes = "";
    try {
      const parts: string[] = [];
      for (const file of files) {
        const extracted = await resolveNotesFromUploadedFile(file);
        if (extracted.trim()) parts.push(extracted);
      }
      notes = parts.join("\n");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossibile leggere il file";
      return { ok: false, status: 400, error: message };
    }

    if (!company || company.length < 2) return { ok: false, status: 400, error: "Payload non valido" };
    if (!sector || sector.length < 2) return { ok: false, status: 400, error: "Payload non valido" };
    if (!Array.isArray(palette) || palette.length < 1 || palette.length > 10) {
      return { ok: false, status: 400, error: "Payload non valido" };
    }
    if (!palette.every((c) => /^#[0-9a-fA-F]{6}$/.test(c))) {
      return { ok: false, status: 400, error: "Payload non valido" };
    }
    if (website) {
      try {
        new URL(website);
      } catch {
        return { ok: false, status: 400, error: "Payload non valido" };
      }
    }

    return { ok: true, data: { company, website, sector, palette, notes, linkSlug, style } };
  }

  const body = await request.json().catch(() => null);
  const parsed = createProposalSchema.safeParse(body);
  if (!parsed.success) {
    return { ok: false, status: 400, error: "Payload non valido" };
  }

  const linkSlug =
    body && typeof body === "object" && "linkSlug" in body ? String((body as { linkSlug?: string }).linkSlug || "").trim() : "";

  const style =
    body && typeof body === "object" && "style" in body
      ? parseStyle(String((body as { style?: string }).style || ""))
      : DEFAULT_PROPOSAL_STYLE;

  return {
    ok: true,
    data: {
      company: parsed.data.company,
      website: parsed.data.website,
      sector: parsed.data.sector,
      palette: parsed.data.palette,
      notes: parsed.data.notes.trim(),
      linkSlug,
      style
    }
  };
}

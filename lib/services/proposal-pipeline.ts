import { createProposal, isShareTokenTaken } from "@/lib/db/repositories";
import {
  fallbackShareToken,
  isValidProposalSlug,
  slugifyProposalLink
} from "@/lib/proposals/slug";
import { analyzeWebsitePalette } from "@/lib/services/brand";
import { estimateBudgetFromNotes } from "@/lib/services/proposal-estimate";
import { generateProposalHtml, type ProposalHtmlSource } from "@/lib/services/proposal-ai";
import {
  ensurePricingTableTotal,
  normalizeProposalPricingTable
} from "@/lib/proposals/pricing-table";
import { sanitizeProposalHtml } from "@/lib/proposals/sanitize";
import { formatReadableText } from "@/lib/utils/text";

export type ProposalBuildInput = {
  tenantId: string;
  company: string;
  website: string;
  sector: string;
  palette: string[];
  notes: string;
  linkSlug?: string;
};

export type ProposalBuildResult = {
  id: string;
  shareToken: string;
  expiresAt: string;
  budget: number;
  palette: string[];
  sector: string;
  contentSource: ProposalHtmlSource;
  aiError?: string;
};

export type ProgressCallback = (percent: number, label: string) => void;

async function pickShareToken(company: string, linkSlug?: string) {
  const preferred = linkSlug?.trim() ? slugifyProposalLink(linkSlug) : slugifyProposalLink(company);
  const candidates = [preferred, `${preferred}-${Date.now().toString(36).slice(-4)}`, fallbackShareToken()].filter(
    Boolean
  ) as string[];

  for (const token of candidates) {
    if (!isValidProposalSlug(token)) continue;
    if (!(await isShareTokenTaken(token))) return token;
  }
  return fallbackShareToken();
}

export async function buildAndSaveProposal(
  input: ProposalBuildInput,
  onProgress?: ProgressCallback
): Promise<ProposalBuildResult> {
  onProgress?.(8, "Lettura e validazione documenti...");
  const { tenantId, company, website, sector, palette, notes, linkSlug } = input;

  onProgress?.(22, website ? "Analisi brand dal sito web..." : "Preparazione palette brand...");
  const brand = website ? await analyzeWebsitePalette(website) : null;
  const resolvedPalette = brand?.palette?.length ? brand.palette : palette;

  onProgress?.(40, "Stima budget e settore di attività...");
  const estimate = await estimateBudgetFromNotes({ notes, company, sector, website });
  const budget = estimate.budget;
  const resolvedSector = formatReadableText(estimate.sectorSummary || sector);

  onProgress?.(58, "Generazione contenuto con intelligenza artificiale...");
  const generated = await generateProposalHtml({
    company,
    sector: resolvedSector,
    notes,
    budget,
    palette: resolvedPalette,
    styleDirection: brand?.styleDirection
  });
  const rawHtml = generated.html;

  const generatedHtml = ensurePricingTableTotal(
    normalizeProposalPricingTable(sanitizeProposalHtml(rawHtml), budget),
    budget
  );

  onProgress?.(82, "Creazione link personalizzato...");
  const shareToken = await pickShareToken(company, linkSlug);

  onProgress?.(92, "Salvataggio preventivo su cloud...");
  const proposal = await createProposal({
    tenantId,
    company,
    website,
    sector: resolvedSector,
    notes,
    budget,
    palette: resolvedPalette,
    generatedHtml: generatedHtml || "",
    styleDirection: brand?.styleDirection || "",
    shareToken
  });

  onProgress?.(100, "Preventivo pronto!");

  return {
    id: proposal.id,
    shareToken: proposal.shareToken,
    expiresAt: proposal.expiresAt,
    budget,
    palette: resolvedPalette,
    sector: resolvedSector,
    contentSource: generated.source,
    aiError: generated.aiError
  };
}

import { buildFallbackProposalDocument } from "@/lib/proposals/document-fallback";
import {
  normalizeProposalDocument,
  parseProposalDocumentJson,
  proposalDocumentSchema,
  type ProposalDocument
} from "@/lib/proposals/document-schema";
import { buildProposalDocumentAiMessages } from "@/lib/services/proposal-ai-document-prompt";
import { geminiChatCompletion, getGeminiConfig } from "@/lib/services/gemini-client";
import { logger } from "@/lib/logger";

export type ProposalDocumentSource = "ai" | "fallback";

export type ProposalDocumentGeneration = {
  document: ProposalDocument;
  source: ProposalDocumentSource;
  aiError?: string;
};

function isUsableDocument(document: ProposalDocument) {
  const types = new Set(document.sections.map((s) => s.type));
  return types.has("hero") && types.has("pricing") && document.sections.length >= 6;
}

export async function generateProposalDocument(input: {
  company: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
  styleDirection?: string;
  style?: string;
}): Promise<ProposalDocumentGeneration> {
  const fallback = () =>
    normalizeProposalDocument(
      buildFallbackProposalDocument({
        company: input.company,
        sector: input.sector,
        notes: input.notes,
        budget: input.budget
      }),
      input.budget
    );

  if (!getGeminiConfig().apiKey) {
    return { document: fallback(), source: "fallback", aiError: "GEMINI_API_KEY mancante" };
  }

  const { messages } = buildProposalDocumentAiMessages(input);
  const attempts = [
    { maxTokens: 8192, timeoutMs: 90_000, label: "primary" },
    { maxTokens: 6000, timeoutMs: 75_000, label: "retry" }
  ] as const;

  let lastError = "Risposta AI non valida";

  for (const attempt of attempts) {
    const result = await geminiChatCompletion({
      messages,
      temperature: 0.45,
      maxTokens: attempt.maxTokens,
      timeoutMs: attempt.timeoutMs,
      jsonMode: true
    });

    if (!result.ok) {
      lastError = result.error || `HTTP ${result.status ?? "?"}`;
      logger.warn(
        { attempt: attempt.label, status: result.status, error: result.error, model: result.model },
        "proposal_document.generation_failed"
      );
      continue;
    }

    const parsed = parseProposalDocumentJson(result.content);
    if (!parsed || !isUsableDocument(parsed)) {
      lastError = "JSON preventivo incompleto o non valido";
      logger.warn(
        { attempt: attempt.label, preview: result.content.slice(0, 200) },
        "proposal_document.invalid_json"
      );
      continue;
    }

    const validated = proposalDocumentSchema.safeParse(parsed);
    const document = normalizeProposalDocument(
      validated.success ? validated.data : parsed,
      input.budget
    );

    logger.info(
      { attempt: attempt.label, sections: document.sections.length },
      "proposal_document.generation_ok"
    );
    return { document, source: "ai" };
  }

  return { document: fallback(), source: "fallback", aiError: lastError };
}

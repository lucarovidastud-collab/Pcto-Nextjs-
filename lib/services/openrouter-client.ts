import { logger } from "@/lib/logger";

export type OpenRouterChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "user"; content: Array<{ type: string; text?: string; image_url?: { url: string } }> };

/** Default model on OpenRouter (gemini-2.0-flash-001 was retired 2026-06-01). */
export const OPENROUTER_DEFAULT_MODEL = "google/gemini-2.5-flash";

const RETIRED_MODELS = new Set(["google/gemini-2.0-flash-001", "google/gemini-2.0-flash"]);

const FALLBACK_MODELS = [
  OPENROUTER_DEFAULT_MODEL,
  "google/gemini-3.1-flash-lite",
  "openai/gpt-4o-mini"
] as const;

export function getOpenRouterConfig() {
  return {
    apiKey: (process.env.OPENROUTER_API_KEY || "").trim(),
    model: (process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL).trim(),
    referer: (process.env.APP_URL || "https://pcto-nextjs.vercel.app").replace(/\/$/, "")
  };
}

export function modelsToTry(primary: string): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  const add = (model: string) => {
    const trimmed = model.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    list.push(trimmed);
  };

  add(primary);
  if (RETIRED_MODELS.has(primary)) {
    add(OPENROUTER_DEFAULT_MODEL);
  }
  for (const fallback of FALLBACK_MODELS) {
    add(fallback);
  }
  return list;
}

export function extractJsonFromModelText(text: string): string | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? null;
}

async function requestChatCompletion(
  model: string,
  input: {
    messages: OpenRouterChatMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    timeoutMs?: number;
  },
  referer: string,
  apiKey: string
): Promise<
  | { ok: true; content: string; model: string }
  | { ok: false; status?: number; error: string; model: string }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 60_000);

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": referer,
        "X-Title": "QuoteGen Engine"
      },
      body: JSON.stringify({
        model,
        temperature: input.temperature ?? 0.2,
        max_tokens: input.maxTokens ?? 800,
        ...(input.jsonMode ? { response_format: { type: "json_object" } } : {}),
        messages: input.messages
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      return {
        ok: false,
        model,
        status: response.status,
        error: errBody.slice(0, 300) || `HTTP ${response.status}`
      };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = String(payload?.choices?.[0]?.message?.content || "").trim();
    if (!content) {
      return { ok: false, model, error: "Risposta AI vuota" };
    }

    return { ok: true, model, content };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Errore di rete";
    return { ok: false, model, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function openRouterChatCompletion(input: {
  messages: OpenRouterChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}): Promise<
  | { ok: true; content: string }
  | { ok: false; status?: number; error: string; model?: string }
> {
  const { apiKey, model, referer } = getOpenRouterConfig();
  if (!apiKey) {
    return { ok: false, error: "OPENROUTER_API_KEY mancante" };
  }

  const candidates = modelsToTry(model);
  let lastFailure: { ok: false; status?: number; error: string; model: string } = {
    ok: false,
    model: candidates[0] ?? model,
    error: "Nessun modello configurato"
  };

  for (const attemptModel of candidates) {
    const result = await requestChatCompletion(attemptModel, input, referer, apiKey);
    if (result.ok) {
      if (attemptModel !== model) {
        logger.info(
          { configured: model, used: attemptModel },
          "openrouter.model_fallback"
        );
      }
      return { ok: true, content: result.content };
    }

    lastFailure = result;
    if (result.status !== 404) {
      return { ok: false, status: result.status, error: result.error, model: attemptModel };
    }
  }

  if (input.jsonMode) {
    const plain = await requestChatCompletion(
      candidates[0] ?? model,
      { ...input, jsonMode: false },
      referer,
      apiKey
    );
    if (plain.ok) {
      return { ok: true, content: plain.content };
    }
    if (plain.status && plain.status !== 404) {
      return { ok: false, status: plain.status, error: plain.error, model: plain.model };
    }
    lastFailure = plain;
  }

  return {
    ok: false,
    status: lastFailure.status,
    error: lastFailure.error,
    model: lastFailure.model
  };
}

export function describeOpenRouterFailure(
  result: { status?: number; error: string; model?: string },
  configuredModel: string
): string {
  const model = result.model || configuredModel;
  if (result.status === 404) {
    if (RETIRED_MODELS.has(configuredModel)) {
      return `Stima di riserva (modello ${configuredModel} ritirato; usa ${OPENROUTER_DEFAULT_MODEL} in OPENROUTER_MODEL)`;
    }
    return `Stima di riserva (modello ${model} non disponibile su OpenRouter)`;
  }
  return `Stima di riserva (AI non raggiungibile${result.status ? `, HTTP ${result.status}` : ""})`;
}

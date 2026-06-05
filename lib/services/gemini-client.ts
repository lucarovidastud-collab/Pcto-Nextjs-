import { logger } from "@/lib/logger";

export type GeminiTextPart = { type: "text"; text: string };
export type GeminiImagePart = { type: "image_url"; image_url: { url: string } };
export type GeminiContentPart = GeminiTextPart | GeminiImagePart;

export type GeminiChatMessage =
  | { role: "system" | "user"; content: string }
  | { role: "user"; content: GeminiContentPart[] };

/** Modello predefinito per generazione preventivi (qualità massima). */
export const GEMINI_DEFAULT_MODEL = "gemini-2.5-pro";

/** Modello veloce per stime JSON / analisi brand. */
export const GEMINI_FAST_MODEL = "gemini-2.5-flash";

const FALLBACK_MODELS = [GEMINI_DEFAULT_MODEL, GEMINI_FAST_MODEL, "gemini-2.0-flash"] as const;

export function getGeminiConfig() {
  return {
    apiKey: (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "").trim(),
    model: (process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL).trim(),
    fastModel: (process.env.GEMINI_FAST_MODEL || GEMINI_FAST_MODEL).trim()
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
  for (const fallback of FALLBACK_MODELS) add(fallback);
  return list;
}

export function extractJsonFromModelText(text: string): string | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? null;
}

type GeminiPart = { text?: string; inlineData?: { mimeType: string; data: string } };

async function toGeminiParts(content: string | GeminiContentPart[]): Promise<GeminiPart[]> {
  if (typeof content === "string") return [{ text: content }];

  const parts: GeminiPart[] = [];
  for (const block of content) {
    if (block.type === "text") {
      parts.push({ text: block.text });
      continue;
    }
    try {
      const res = await fetch(block.image_url.url);
      if (!res.ok) continue;
      const mimeType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/jpeg";
      const buffer = Buffer.from(await res.arrayBuffer());
      parts.push({ inlineData: { mimeType, data: buffer.toString("base64") } });
    } catch {
      // immagine non scaricabile: salta
    }
  }
  return parts;
}

async function requestGenerateContent(
  model: string,
  input: {
    messages: GeminiChatMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    timeoutMs?: number;
  },
  apiKey: string
): Promise<
  | { ok: true; content: string; model: string }
  | { ok: false; status?: number; error: string; model: string }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 60_000);

  const systemMessage = input.messages.find((m) => m.role === "system");
  const systemInstruction = systemMessage
    ? { parts: [{ text: typeof systemMessage.content === "string" ? systemMessage.content : "" }] }
    : undefined;

  const contents: Array<{ role: "user" | "model"; parts: GeminiPart[] }> = [];
  for (const message of input.messages) {
    if (message.role === "system") continue;
    const parts = await toGeminiParts(message.content);
    if (!parts.length) continue;
    contents.push({ role: "user", parts });
  }

  if (!contents.length) {
    clearTimeout(timeout);
    return { ok: false, model, error: "Nessun messaggio utente" };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(systemInstruction ? { systemInstruction } : {}),
        contents,
        generationConfig: {
          temperature: input.temperature ?? 0.2,
          maxOutputTokens: input.maxTokens ?? 8192,
          ...(input.jsonMode ? { responseMimeType: "application/json" } : {})
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => "");
      return {
        ok: false,
        model,
        status: response.status,
        error: errBody.slice(0, 400) || `HTTP ${response.status}`
      };
    }

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const content = String(payload?.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
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

export async function geminiChatCompletion(input: {
  messages: GeminiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
  /** Se impostato, usa questo modello invece di GEMINI_MODEL. */
  model?: string;
}): Promise<
  | { ok: true; content: string; model: string }
  | { ok: false; status?: number; error: string; model?: string }
> {
  const { apiKey, model: configuredModel } = getGeminiConfig();
  if (!apiKey) {
    return { ok: false, error: "GEMINI_API_KEY mancante" };
  }

  const primary = input.model || configuredModel;
  const candidates = modelsToTry(primary);
  let lastFailure: { ok: false; status?: number; error: string; model: string } = {
    ok: false,
    model: candidates[0] ?? primary,
    error: "Nessun modello configurato"
  };

  for (const attemptModel of candidates) {
    const result = await requestGenerateContent(attemptModel, input, apiKey);
    if (result.ok) {
      if (attemptModel !== primary) {
        logger.info({ configured: primary, used: attemptModel }, "gemini.model_fallback");
      }
      return result;
    }

    lastFailure = result;
    if (result.status !== 404 && result.status !== 400) {
      return { ok: false, status: result.status, error: result.error, model: attemptModel };
    }
  }

  if (input.jsonMode) {
    const plain = await requestGenerateContent(
      candidates[0] ?? primary,
      { ...input, jsonMode: false },
      apiKey
    );
    if (plain.ok) return plain;
    if (plain.status && plain.status !== 404 && plain.status !== 400) {
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

export function describeGeminiFailure(
  result: { status?: number; error: string; model?: string },
  configuredModel: string
): string {
  const model = result.model || configuredModel;
  if (result.status === 404 || result.status === 400) {
    return `Stima di riserva (modello ${model} non disponibile su Google AI)`;
  }
  return `Stima di riserva (AI non raggiungibile${result.status ? `, HTTP ${result.status}` : ""})`;
}

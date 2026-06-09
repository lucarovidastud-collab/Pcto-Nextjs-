import { GoogleAuth, type JWTInput } from "google-auth-library";
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
const VERTEX_SCOPE = "https://www.googleapis.com/auth/cloud-platform";
const DEFAULT_AGENT_PLATFORM_LOCATION = "global";

type AuthMode = "api_key_express" | "api_key_project" | "service_account";

type CachedToken = { token: string; expiresAt: number };
let cachedAccessToken: CachedToken | null = null;
let authClient: GoogleAuth | null = null;

function parseJsonCredentials(raw: string): JWTInput | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as JWTInput;
  } catch {
    return null;
  }
}

function resolveApiKey(): string {
  return (
    process.env.GOOGLE_API_KEY ||
    process.env.VERTEX_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    ""
  ).trim();
}

function resolveServiceAccountCredentials(): JWTInput | null {
  const json =
    process.env.VERTEX_SERVICE_ACCOUNT_JSON ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON ||
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
    "";

  const parsedJson = parseJsonCredentials(json);
  if (parsedJson?.client_email && parsedJson?.private_key) {
    return parsedJson;
  }

  const clientEmail = (process.env.VERTEX_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKey = (process.env.VERTEX_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || "")
    .trim()
    .replace(/\\n/g, "\n");

  if (clientEmail && privateKey) {
    return { client_email: clientEmail, private_key: privateKey };
  }

  return null;
}

function resolveVertexProjectId(): string {
  return (
    process.env.VERTEX_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCP_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    ""
  ).trim();
}

function resolveVertexLocation(): string {
  return (
    process.env.VERTEX_LOCATION ||
    process.env.GOOGLE_CLOUD_LOCATION ||
    process.env.GCP_LOCATION ||
    DEFAULT_AGENT_PLATFORM_LOCATION
  ).trim();
}

function resolveAuthMode(): AuthMode | null {
  const apiKey = resolveApiKey();
  const projectId = resolveVertexProjectId();
  const credentials = resolveServiceAccountCredentials();
  const mode = (process.env.VERTEX_AUTH_MODE || process.env.GOOGLE_GENAI_AUTH_MODE || "").trim().toLowerCase();

  if (mode === "express" || mode === "api_key") {
    return apiKey ? "api_key_express" : null;
  }
  if (mode === "service_account" || mode === "adc") {
    return projectId && credentials ? "service_account" : null;
  }

  // Agent Platform express: solo chiave API (console → Recupera chiave API)
  if (apiKey && !projectId) return "api_key_express";
  if (apiKey && projectId) return "api_key_project";
  if (projectId && credentials) return "service_account";
  return null;
}

export function getGeminiConfig() {
  const authMode = resolveAuthMode();

  return {
    configured: authMode !== null,
    authMode,
    apiKey: resolveApiKey(),
    projectId: resolveVertexProjectId(),
    location: resolveVertexLocation(),
    model: (process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL).trim(),
    fastModel: (process.env.GEMINI_FAST_MODEL || GEMINI_FAST_MODEL).trim()
  };
}

export function isGeminiConfigured(): boolean {
  return getGeminiConfig().configured;
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

function getGoogleAuth(): GoogleAuth | null {
  const credentials = resolveServiceAccountCredentials();
  if (!credentials) return null;
  if (!authClient) {
    authClient = new GoogleAuth({ credentials, scopes: [VERTEX_SCOPE] });
  }
  return authClient;
}

async function getVertexAccessToken(): Promise<string | null> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt) {
    return cachedAccessToken.token;
  }

  const auth = getGoogleAuth();
  if (!auth) return null;

  try {
    const client = await auth.getClient();
    const response = await client.getAccessToken();
    const token = typeof response === "string" ? response : response?.token;
    if (!token) return null;

    cachedAccessToken = {
      token,
      expiresAt: Date.now() + 3_500_000
    };
    return token;
  } catch (err) {
    logger.warn({ err }, "vertex.access_token.failed");
    return null;
  }
}

function buildGenerateUrl(
  model: string,
  authMode: AuthMode,
  projectId: string,
  location: string,
  apiKey: string
): string {
  if (authMode === "api_key_express") {
    return `https://aiplatform.googleapis.com/v1/publishers/google/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  }

  const base =
    location === "global"
      ? `https://aiplatform.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/global/publishers/google/models/${encodeURIComponent(model)}`
      : `https://${location}-aiplatform.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/locations/${encodeURIComponent(location)}/publishers/google/models/${encodeURIComponent(model)}`;

  const url = `${base}:generateContent`;
  if (authMode === "api_key_project") {
    return `${url}?key=${encodeURIComponent(apiKey)}`;
  }
  return url;
}

async function requestGenerateContent(
  model: string,
  input: {
    messages: GeminiChatMessage[];
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    timeoutMs?: number;
  }
): Promise<
  | { ok: true; content: string; model: string }
  | { ok: false; status?: number; error: string; model: string }
> {
  const { authMode, apiKey, projectId, location } = getGeminiConfig();

  if (!authMode) {
    return { ok: false, model, error: "Credenziali Agent Platform / Vertex AI mancanti" };
  }

  let accessToken: string | null = null;
  if (authMode === "service_account") {
    accessToken = await getVertexAccessToken();
    if (!accessToken) {
      return { ok: false, model, error: "Credenziali service account non valide" };
    }
  } else if (!apiKey) {
    return { ok: false, model, error: "GOOGLE_API_KEY mancante" };
  }

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

  const url = buildGenerateUrl(model, authMode, projectId, location, apiKey);
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers,
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
  if (!isGeminiConfigured()) {
    return { ok: false, error: "Credenziali Agent Platform / Vertex AI mancanti" };
  }

  const { model: configuredModel } = getGeminiConfig();
  const primary = input.model || configuredModel;
  const candidates = modelsToTry(primary);
  let lastFailure: { ok: false; status?: number; error: string; model: string } = {
    ok: false,
    model: candidates[0] ?? primary,
    error: "Nessun modello configurato"
  };

  for (const attemptModel of candidates) {
    const result = await requestGenerateContent(attemptModel, input);
    if (result.ok) {
      if (attemptModel !== primary) {
        logger.info({ configured: primary, used: attemptModel }, "agent_platform.model_fallback");
      }
      return result;
    }

    lastFailure = result;
    if (result.status !== 404 && result.status !== 400) {
      return { ok: false, status: result.status, error: result.error, model: attemptModel };
    }
  }

  if (input.jsonMode) {
    const plain = await requestGenerateContent(candidates[0] ?? primary, { ...input, jsonMode: false });
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
    return `Stima di riserva (modello ${model} non disponibile su Agent Platform)`;
  }
  return `Stima di riserva (AI non raggiungibile${result.status ? `, HTTP ${result.status}` : ""})`;
}

/** Solo per test: reset cache token/auth tra i casi. */
export function resetGeminiClientCacheForTests() {
  cachedAccessToken = null;
  authClient = null;
}

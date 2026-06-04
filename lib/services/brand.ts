import sharp from "sharp";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "google/gemini-2.5-flash";

function normalizeHex(color: string) {
  const clean = color.replace("#", "").trim().toUpperCase();
  if (clean.length === 3) {
    return `#${clean[0]}${clean[0]}${clean[1]}${clean[1]}${clean[2]}${clean[2]}`;
  }
  return `#${clean.slice(0, 6).padEnd(6, "0")}`;
}

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      host !== "localhost" &&
      host !== "127.0.0.1" &&
      !host.startsWith("10.") &&
      !host.startsWith("192.168.")
    );
  } catch {
    return false;
  }
}

function extractPalette(html: string) {
  const candidates = new Map<string, number>();
  const add = (color: string, weight = 1) => {
    const normalized = normalizeHex(color);
    if (!/^#[0-9A-F]{6}$/.test(normalized)) return;
    candidates.set(normalized, (candidates.get(normalized) || 0) + weight);
  };
  for (const match of html.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) add(match[0], 1);
  for (const match of html.matchAll(/rgba?\(\s*(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/gi)) {
    const hex = [match[1], match[2], match[3]]
      .map((v) => Number(v).toString(16).padStart(2, "0"))
      .join("");
    add(`#${hex}`, 1);
  }
  return [...candidates.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([color]) => color)
    .slice(0, 6);
}

async function fetchLinkedCss(baseWebsite: string, html: string) {
  const urls = new Set<string>();
  for (const match of html.matchAll(/<link[^>]+rel=["'][^"']*stylesheet[^"']*["'][^>]*>/gi)) {
    const href = match[0].match(/href=["']([^"']+)["']/i)?.[1];
    if (!href) continue;
    try {
      urls.add(new URL(href, baseWebsite).toString());
    } catch {
      // ignore
    }
    if (urls.size >= 5) break;
  }
  const chunks: string[] = [];
  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: { Accept: "text/css,*/*" } });
      if (res.ok) chunks.push((await res.text()).slice(0, 120_000));
    } catch {
      // ignore
    }
  }
  return chunks.join("\n");
}

async function refinePaletteWithAI(website: string, screenshotUrls: string[], fallbackPalette: string[]) {
  if (!OPENROUTER_API_KEY || !screenshotUrls.length) return null;
  const blocks = screenshotUrls.slice(0, 4).map((url) => ({ type: "image_url", image_url: { url } }));
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            'Rispondi solo JSON: {"palette":["#RRGGBB"],"styleDirection":"..."}'
        },
        {
          role: "user",
          content: [
            { type: "text", text: `Analizza brand UI del sito ${website}. Fallback: ${JSON.stringify(fallbackPalette)}` },
            ...blocks
          ]
        }
      ]
    })
  });
  if (!response.ok) return null;
  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content || "";
  const match = String(text).match(/\{[\s\S]*\}/);
  if (!match) return null;
  const parsed = JSON.parse(match[0]) as { palette?: string[]; styleDirection?: string };
  const palette = (parsed.palette || [])
    .map((c) => normalizeHex(String(c)))
    .filter((c) => /^#[0-9A-F]{6}$/.test(c));
  if (!palette.length) return null;
  return { palette, styleDirection: parsed.styleDirection || "" };
}

export async function analyzeWebsitePalette(website: string) {
  if (!isPublicHttpUrl(website)) {
    return {
      palette: ["#0F766E", "#D946EF", "#F59E0B"],
      source: "fallback",
      styleDirection: "",
      message: "URL non valido"
    };
  }

  try {
    const response = await fetch(website, {
      headers: { "User-Agent": "QuoteGenEngine/2.0", Accept: "text/html" }
    });
    const html = (await response.text()).slice(0, 300_000);
    const inlinePalette = extractPalette(html);
    const cssPalette = extractPalette(await fetchLinkedCss(website, html));
    const fallbackPalette = [...new Set([...inlinePalette, ...cssPalette])].slice(0, 6);
    const screenshotUrls = [
      `https://image.thum.io/get/width/1400/crop/900/noanimate/${encodeURIComponent(website)}`
    ];

    let screenshotPalette: string[] = [];
    try {
      const shotRes = await fetch(screenshotUrls[0]);
      if (shotRes.ok && sharp) {
        const buf = Buffer.from(await shotRes.arrayBuffer());
        const { data, info } = await sharp(buf).resize(180, 120, { fit: "cover" }).raw().toBuffer({ resolveWithObject: true });
        const buckets = new Map<string, number>();
        for (let i = 0; i < data.length; i += info.channels) {
          const r = Math.round(data[i] / 32) * 32;
          const g = Math.round(data[i + 1] / 32) * 32;
          const b = Math.round(data[i + 2] / 32) * 32;
          const hex = normalizeHex(`#${r.toString(16)}${g.toString(16)}${b.toString(16)}`);
          buckets.set(hex, (buckets.get(hex) || 0) + 1);
        }
        screenshotPalette = [...buckets.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([hex]) => hex)
          .slice(0, 5);
      }
    } catch {
      // ignore screenshot failures
    }

    const merged = [...new Set([...screenshotPalette, ...fallbackPalette])].slice(0, 6);
    const ai = await refinePaletteWithAI(website, screenshotUrls, merged);
    const palette = ai?.palette?.length ? ai.palette : merged.length ? merged : ["#0F766E", "#D946EF", "#F59E0B"];

    return {
      palette,
      source: ai?.palette?.length ? "openrouter-visual" : "site+css",
      styleDirection: ai?.styleDirection || "",
      message: ai?.palette?.length ? "Palette AI da screenshot e markup" : "Palette estratta da sito"
    };
  } catch {
    return {
      palette: ["#0F766E", "#D946EF", "#F59E0B"],
      source: "fallback",
      styleDirection: "",
      message: "Sito non raggiungibile"
    };
  }
}

/**
 * Generates static Hi-Fi + wireframe HTML boards for Figma html-to-design capture.
 * Served at /figma-boards/{mode}/{id}.html
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "figma-boards");

const TOKENS = {
  bg: "#faf9f6",
  fg: "#0f172a",
  muted: "#475569",
  line: "rgba(15, 23, 42, 0.08)",
  accent: "#0d9488",
  accent2: "#8b5cf6",
  panel: "rgba(255, 255, 255, 0.85)"
};

const SCREENS = [
  {
    id: "01-landing",
    title: "01 — Landing",
    hifi: landingHifi,
    wf: landingWf
  },
  { id: "02-login", title: "02 — Login", hifi: loginHifi, wf: loginWf },
  { id: "03-workspace", title: "03 — Workspace", hifi: workspaceHifi, wf: workspaceWf },
  { id: "04-subscribe", title: "04 — Subscribe", hifi: subscribeHifi, wf: subscribeWf },
  { id: "05-billing", title: "05 — Billing", hifi: billingHifi, wf: billingWf },
  { id: "06-checkout", title: "06 — Checkout", hifi: checkoutHifi, wf: checkoutWf },
  { id: "07-proposta-cliente", title: "07 — Proposta cliente", hifi: proposalClientHifi, wf: proposalClientWf },
  { id: "08-dettaglio-proposta", title: "08 — Dettaglio proposta", hifi: proposalDetailHifi, wf: proposalDetailWf },
  { id: "09-termini", title: "09 — Termini", hifi: () => legalHifi("Termini di Servizio"), wf: () => legalWf("Termini") },
  { id: "10-privacy", title: "10 — Privacy", hifi: () => legalHifi("Privacy Policy"), wf: () => legalWf("Privacy") },
  { id: "11-admin-login", title: "11 — Admin login", hifi: adminLoginHifi, wf: adminLoginWf },
  { id: "12-backoffice", title: "12 — Backoffice", hifi: adminHifi, wf: adminWf }
];

function shell(mode, title, body) {
  const wf = mode === "wf";
  const bg = wf ? "#f4f4f5" : TOKENS.bg;
  const fg = wf ? "#18181b" : TOKENS.fg;
  const muted = wf ? "#71717a" : TOKENS.muted;
  const accent = wf ? "#52525b" : TOKENS.accent;
  const accent2 = wf ? "#a1a1aa" : TOKENS.accent2;
  const panel = wf ? "#ffffff" : TOKENS.panel;
  const line = wf ? "#e4e4e7" : TOKENS.line;
  const radius = wf ? "4px" : "16px";
  const font = "Inter, system-ui, sans-serif";

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=1440" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1440px; min-height: 900px; font-family: ${font};
      background: ${bg}; color: ${fg};
      ${wf ? "" : `background-image: radial-gradient(circle at 20% 20%, rgba(13,148,136,0.08), transparent 40%), radial-gradient(circle at 80% 0%, rgba(139,92,246,0.1), transparent 35%);`}
    }
    .wrap { padding: 0; }
    .glass {
      background: ${panel}; border: 1px solid ${line};
      border-radius: ${radius}; backdrop-filter: blur(8px);
    }
    .btn-p {
      background: ${wf ? "#3f3f46" : `linear-gradient(135deg, ${accent}, ${accent2})`};
      color: #fff; border: none; border-radius: ${wf ? "4px" : "12px"};
      padding: 12px 20px; font-weight: 800; font-size: 13px;
    }
    .btn-s {
      background: ${wf ? "#fff" : "rgba(255,255,255,0.7)"};
      border: 1px solid ${line}; border-radius: ${wf ? "4px" : "12px"};
      padding: 12px 20px; font-weight: 700; font-size: 13px; color: ${fg};
    }
    .muted { color: ${muted}; }
    .accent { color: ${accent}; }
    .grad {
      ${wf ? `color: ${fg};` : `background: linear-gradient(90deg, ${accent}, ${accent2}); -webkit-background-clip: text; color: transparent;`}
    }
    h1 { font-size: 56px; font-weight: 900; line-height: 1.05; letter-spacing: -0.03em; }
    h2 { font-size: 28px; font-weight: 900; }
    h3 { font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: ${muted}; }
    .chip {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 800;
      border: 1px solid ${line}; background: ${wf ? "#fff" : "rgba(255,255,255,0.6)"};
      color: ${accent};
    }
    .block { height: 12px; background: ${wf ? "#d4d4d8" : line}; border-radius: 4px; }
    .block.sm { width: 40%; height: 8px; }
    .block.md { width: 65%; }
    .block.lg { width: 90%; }
    .placeholder {
      background: ${wf ? "#e4e4e7" : "rgba(15,23,42,0.06)"};
      border: 1px dashed ${wf ? "#a1a1aa" : line}; border-radius: ${radius};
    }
  </style>
</head>
<body data-screen="${title}" data-mode="${mode}">
  <div class="wrap">${body}</div>
</body>
</html>`;
}

function headerBar(wf, brand = "QuoteGen Engine") {
  const logo = wf
    ? `<span style="width:36px;height:36px;border-radius:4px;background:#d4d4d8;display:inline-block"></span>`
    : `<span style="width:36px;height:36px;border-radius:12px;background:linear-gradient(135deg,#0d9488,#8b5cf6);display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:14px">✦</span>`;
  return `<header class="glass" style="display:flex;align-items:center;justify-content:space-between;padding:16px 48px;border-left:0;border-right:0;border-top:0">
    <div style="display:flex;align-items:center;gap:12px;font-weight:900;font-size:18px">${logo}<span>${brand.split(" ")[0]} <span class="grad">${brand.includes("Engine") ? "Engine" : ""}</span></span></div>
    <div style="display:flex;gap:12px"><button class="btn-s">Accedi</button></div>
  </header>`;
}

function landingHifi() {
  return `${headerBar(false)}
  <section style="padding:80px 48px;text-align:center;max-width:1100px;margin:0 auto">
    <div class="chip" style="margin-bottom:24px">✦ Nuova versione enterprise con IA Generativa</div>
    <h1>Preventivi commerciali con <span class="grad">AI & Brand Styling</span></h1>
    <p class="muted" style="margin-top:24px;font-size:20px;line-height:1.5">Incolla appunti disordinati. QuoteGen analizza il sito del cliente, stima il budget e genera una proposta firmabile online.</p>
    <div style="margin-top:40px;display:flex;gap:16px;justify-content:center"><button class="btn-p">Crea preventivo gratis →</button><button class="btn-s">Esplora i piani</button></div>
    <div class="glass" style="margin-top:64px;padding:24px;text-align:left">
      <div style="display:flex;justify-content:space-between;border-bottom:1px solid rgba(15,23,42,0.08);padding-bottom:16px;margin-bottom:20px">
        <span class="muted" style="font-family:monospace;font-size:12px">workspace/prop_0912f.pdf</span>
        <span class="chip">Analisi completata</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">
        <div class="glass" style="padding:20px"><h3>Cliente</h3><p style="font-size:22px;font-weight:900;margin-top:8px">KFC Corporation</p></div>
        <div class="glass" style="padding:20px"><h3>Budget stimato</h3><p style="font-size:22px;font-weight:900;margin-top:8px;color:#0d9488">€ 24.500</p></div>
      </div>
    </div>
  </section>`;
}

function landingWf() {
  return `${headerBar(true)}
  <section style="padding:60px 48px;text-align:center">
    <div class="block sm" style="margin:0 auto 20px"></div>
    <div class="block lg" style="margin:0 auto;height:48px"></div>
    <div class="block md" style="margin:16px auto 0"></div>
    <div style="margin-top:32px;display:flex;gap:12px;justify-content:center"><div class="placeholder" style="width:180px;height:44px"></div><div class="placeholder" style="width:140px;height:44px"></div></div>
    <div class="placeholder" style="margin-top:48px;height:280px;padding:24px">
      <div class="block md"></div><div class="block lg" style="margin-top:16px"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:24px">
        <div class="placeholder" style="height:100px"></div><div class="placeholder" style="height:100px"></div>
      </div>
    </div>
  </section>`;
}

function loginHifi() {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;min-height:900px">
    <div style="padding:64px;background:linear-gradient(160deg,#0f172a,#0d9488 60%,#8b5cf6);color:#fff;display:flex;flex-direction:column;justify-content:center">
      <p style="font-weight:900;font-size:14px;opacity:0.8">QuoteGen Engine</p>
      <h2 style="font-size:40px;margin-top:16px;color:#fff">Accedi al workspace</h2>
      <p style="margin-top:16px;opacity:0.85;max-width:360px">Genera proposte brandizzate con AI, link condivisibili e firma digitale.</p>
    </div>
    <div style="padding:64px;display:flex;align-items:center;justify-content:center">
      <div class="glass" style="width:100%;max-width:400px;padding:32px">
        <div style="display:flex;gap:8px;margin-bottom:24px"><button class="btn-p" style="flex:1">Accedi</button><button class="btn-s" style="flex:1">Registrati</button></div>
        <div class="placeholder" style="height:44px;margin-bottom:12px"></div>
        <div class="placeholder" style="height:44px;margin-bottom:12px"></div>
        <button class="btn-p" style="width:100%;margin-top:8px">Continua con email</button>
        <p class="muted" style="text-align:center;margin-top:16px;font-size:12px">oppure Google · GitHub</p>
      </div>
    </div>
  </div>`;
}

function loginWf() {
  return `<div style="display:grid;grid-template-columns:1fr 1fr;min-height:900px">
    <div class="placeholder" style="border-radius:0;min-height:900px"></div>
    <div style="padding:64px;display:flex;align-items:center"><div class="placeholder" style="width:380px;height:320px"></div></div>
  </div>`;
}

function workspaceHifi() {
  return `${headerBar(false, "QuoteGen")}
  <div style="padding:32px 48px;max-width:1200px;margin:0 auto">
    <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px">
      <div><h2>Nuovo preventivo</h2><p class="muted" style="margin-top:8px">Compila i dati e genera la proposta con AI</p></div>
      <div class="glass" style="padding:12px 20px;font-size:12px;font-weight:800"><span class="accent">3/10</span> preventivi questo mese</div>
    </div>
    <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:24px">
      <div class="glass" style="padding:28px">
        <h3>Dati cliente</h3>
        <div class="placeholder" style="height:44px;margin-top:16px"></div>
        <div class="placeholder" style="height:44px;margin-top:12px"></div>
        <div class="placeholder" style="height:120px;margin-top:12px"></div>
        <button class="btn-p" style="margin-top:24px;width:100%">Genera proposta AI</button>
      </div>
      <div class="glass" style="padding:28px">
        <h3>Brand estratto</h3>
        <div style="display:flex;gap:8px;margin-top:16px">
          <span style="width:40px;height:40px;border-radius:8px;background:#0d9488"></span>
          <span style="width:40px;height:40px;border-radius:8px;background:#8b5cf6"></span>
          <span style="width:40px;height:40px;border-radius:8px;background:#f59e0b"></span>
        </div>
        <p class="muted" style="margin-top:16px;font-size:13px">Palette da kfc.com · Budget €24.500</p>
      </div>
    </div>
  </div>`;
}

function workspaceWf() {
  return `${headerBar(true)}
  <div style="padding:32px 48px"><div class="block md"></div>
  <div style="display:grid;grid-template-columns:1.2fr 0.8fr;gap:24px;margin-top:24px">
    <div class="placeholder" style="height:380px"></div><div class="placeholder" style="height:380px"></div>
  </div></div>`;
}

function subscribeHifi() {
  return `${headerBar(false)}
  <div style="padding:48px;max-width:1100px;margin:0 auto;text-align:center">
    <p class="chip">Accesso alle funzionalità</p>
    <h2 style="margin-top:16px">Attiva il tuo abbonamento</h2>
    <p class="muted" style="margin-top:12px">Piani Starter, Pro e Enterprise per generare preventivi con AI.</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:40px;text-align:left">
      ${["Starter", "Pro", "Enterprise"].map((p, i) => `<div class="glass" style="padding:24px;${i === 1 ? "border-color:#0d9488;box-shadow:0 12px 40px rgba(13,148,136,0.15)" : ""}"><h3>${p}</h3><p style="font-size:32px;font-weight:900;margin:12px 0">€${i === 0 ? "29" : i === 1 ? "79" : "199"}<span class="muted" style="font-size:14px">/mese</span></p><button class="${i === 1 ? "btn-p" : "btn-s"}" style="width:100%">Scegli piano</button></div>`).join("")}
    </div>
  </div>`;
}

function subscribeWf() {
  return `${headerBar(true)}<div style="padding:48px;text-align:center"><div class="block md" style="margin:0 auto"></div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:32px">${[1, 2, 3].map(() => `<div class="placeholder" style="height:220px"></div>`).join("")}</div></div>`;
}

function billingHifi() {
  return `${headerBar(false)}
  <div style="padding:48px;max-width:900px;margin:0 auto">
    <h2>Piani e pagamenti</h2>
    <div class="glass" style="margin-top:24px;padding:24px;display:flex;justify-content:space-between;align-items:center">
      <div><p class="muted" style="font-size:12px">Piano attuale</p><p style="font-size:24px;font-weight:900">Pro</p></div>
      <button class="btn-s">Gestisci su Stripe</button>
    </div>
  </div>`;
}

function billingWf() {
  return `${headerBar(true)}<div style="padding:48px"><div class="block sm"></div><div class="placeholder" style="height:120px;margin-top:24px"></div></div>`;
}

function checkoutHifi() {
  return `${headerBar(false)}
  <div style="padding:48px;max-width:800px;margin:0 auto">
    <h2>Checkout sicuro</h2>
    <div class="glass" style="margin-top:24px;padding:32px;min-height:400px">
      <p class="muted" style="font-size:12px;font-weight:800">STRIPE EMBEDDED CHECKOUT</p>
      <div class="placeholder" style="height:320px;margin-top:16px;border-style:solid"></div>
    </div>
  </div>`;
}

function checkoutWf() {
  return `${headerBar(true)}<div style="padding:48px"><div class="placeholder" style="height:500px"></div></div>`;
}

function proposalClientHifi() {
  return `<div style="padding:48px;max-width:1000px;margin:0 auto">
    <div class="chip">Proposta commerciale · KFC Corporation</div>
    <h2 style="margin-top:20px">Proposta digitale firmabile</h2>
    <div class="glass" style="margin-top:32px;padding:40px;min-height:500px">
      <h3>Executive summary</h3>
      <p class="muted" style="margin-top:12px;line-height:1.6">Rinnovamento e-commerce B2B con integrazione AI per catalogo e pricing dinamico.</p>
      <p style="margin-top:24px;font-size:28px;font-weight:900;color:#0d9488">Investimento: € 24.500</p>
      <button class="btn-p" style="margin-top:32px">Firma proposta</button>
    </div>
  </div>`;
}

function proposalClientWf() {
  return `<div style="padding:48px"><div class="block sm"></div><div class="placeholder" style="height:600px;margin-top:24px"></div></div>`;
}

function proposalDetailHifi() {
  return `${headerBar(false)}
  <div style="padding:32px 48px;max-width:1100px;margin:0 auto">
    <p class="muted">← Workspace</p>
    <h2 style="margin-top:8px">KFC Corporation — prop_0912</h2>
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:24px;margin-top:24px">
      <div class="glass" style="padding:24px;min-height:400px"><h3>Anteprima HTML</h3></div>
      <div class="glass" style="padding:24px"><h3>Azioni</h3><button class="btn-p" style="width:100%;margin-top:12px">Copia link</button><button class="btn-s" style="width:100%;margin-top:8px">Scarica PDF</button></div>
    </div>
  </div>`;
}

function proposalDetailWf() {
  return `${headerBar(true)}<div style="padding:48px"><div class="block md"></div><div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;margin-top:20px"><div class="placeholder" style="height:400px"></div><div class="placeholder" style="height:400px"></div></div></div>`;
}

function legalHifi(title) {
  return `<main style="padding:64px 48px;max-width:720px;margin:0 auto"><h1>${title}</h1><p class="muted" style="margin-top:24px;line-height:1.7">Testo legale QuoteGen Engine. Pagamenti Stripe, limiti del piano, trattamento dati conforme al GDPR.</p><p class="muted" style="margin-top:16px;line-height:1.7">Per assistenza: support@quotegen.it</p></main>`;
}

function legalWf(title) {
  return `<main style="padding:64px 48px"><div class="block sm"></div><div class="block lg" style="margin-top:20px;height:32px"></div><div class="block md" style="margin-top:16px"></div><div class="block lg" style="margin-top:12px"></div></main>`;
}

function adminLoginHifi() {
  return `<div style="min-height:900px;background:#0f172a;display:flex;align-items:center;justify-content:center">
    <div style="background:#1e293b;border:1px solid #334155;border-radius:16px;padding:40px;width:380px;color:#f8fafc">
      <h2 style="color:#fff">Accesso Riservato</h2>
      <p style="color:#94a3b8;font-size:13px;margin:8px 0 24px">Area di gestione QuoteGen</p>
      <div class="placeholder" style="height:44px;background:#020617;border-color:#334155"></div>
      <div class="placeholder" style="height:44px;margin-top:12px;background:#020617;border-color:#334155"></div>
      <button class="btn-p" style="width:100%;margin-top:16px;background:#6366f1">Entra</button>
    </div>
  </div>`;
}

function adminLoginWf() {
  return `<div style="min-height:900px;display:flex;align-items:center;justify-content:center"><div class="placeholder" style="width:360px;height:300px"></div></div>`;
}

function adminHifi() {
  return `<div style="min-height:900px;background:#0f172a;color:#f8fafc;padding:32px 48px">
    <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:900">QuoteGen Backoffice</span><span class="chip" style="color:#a5b4fc">Admin</span></div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:32px">
      ${["Tenant attivi", "Proposte mese", "MRR", "Alert"].map((l) => `<div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:20px"><p style="font-size:11px;color:#94a3b8">${l}</p><p style="font-size:28px;font-weight:900;margin-top:8px">128</p></div>`).join("")}
    </div>
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;margin-top:24px;padding:20px">
      <h3 style="color:#94a3b8;font-size:12px">TENANT</h3>
      <div style="margin-top:16px;display:grid;gap:8px">${[1, 2, 3].map(() => `<div style="height:48px;background:#020617;border-radius:8px"></div>`).join("")}</div>
    </div>
  </div>`;
}

function adminWf() {
  return `<div style="padding:48px"><div class="block sm"></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:24px">${[1, 2, 3, 4].map(() => `<div class="placeholder" style="height:80px"></div>`).join("")}</div><div class="placeholder" style="height:300px;margin-top:16px"></div></div>`;
}

for (const mode of ["hifi", "wf"]) {
  const dir = join(OUT, mode);
  mkdirSync(dir, { recursive: true });
  for (const s of SCREENS) {
    const body = mode === "hifi" ? s.hifi() : s.wf();
    const html = shell(mode, s.title, body);
    writeFileSync(join(dir, `${s.id}.html`), html, "utf8");
  }
}

const manifest = SCREENS.flatMap((s) => [
  { id: s.id, mode: "hifi", title: s.title, path: `/figma-boards/hifi/${s.id}.html`, frameName: s.title },
  { id: s.id, mode: "wf", title: `WF ${s.title}`, path: `/figma-boards/wf/${s.id}.html`, frameName: `WF ${s.title}` }
]);

writeFileSync(join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`Generated ${manifest.length} boards in public/figma-boards/`);

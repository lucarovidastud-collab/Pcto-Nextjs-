import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { ArrowRight, Sparkles, Shield, Zap, Palette, Award, FileCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen text-[var(--foreground)] selection:bg-[var(--accent)] selection:text-white">
      {/* Sleek Global Header */}
      <header className="glass sticky top-0 z-50 border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_80%,transparent)] px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shadow-md">
              <Sparkles size={16} />
            </span>
            <span className="text-base font-black tracking-tight sm:text-lg">
              QuoteGen{" "}
              <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">Engine</span>
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn-secondary min-h-9 px-4 py-1.5 text-xs font-bold">
              Accedi al Workspace
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-14 sm:px-6 sm:py-20 lg:py-32">
        <div className="mx-auto flex max-w-6xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-4 py-1.5 text-xs font-bold text-[var(--accent)] shadow-sm">
            <Sparkles size={13} />
            <span>Nuova versione enterprise con IA Generativa</span>
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
            Preventivi commerciali con{" "}
            <span className="bg-gradient-to-r from-[var(--accent)] to-[var(--accent-2)] bg-clip-text text-transparent">
              AI & Brand Styling
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-[var(--muted)] sm:text-xl">
            Incolla appunti disordinati. QuoteGen analizza il sito web del cliente, stima il budget, estrae la palette e genera una proposta digitale firmabile online.
          </p>

          <div className="mt-10 flex w-full max-w-md flex-col justify-center gap-3 sm:max-w-none sm:w-auto sm:flex-row sm:gap-4">
            <Link href="/login" className="btn-primary flex w-full items-center justify-center gap-2 px-8 py-3.5 text-sm font-extrabold shadow-lg sm:w-auto">
              Crea preventivo gratis
              <ArrowRight size={16} />
            </Link>
            <a href="#piani" className="btn-secondary w-full px-8 py-3.5 text-sm font-bold sm:w-auto">
              Esplora i piani
            </a>
          </div>

          {/* Interactive Live Mockup Box */}
          <div className="glass-premium mt-16 w-full max-w-4xl rounded-2xl p-2 shadow-2xl">
            <div className="rounded-xl border border-[var(--line)] bg-[var(--background)] p-4 sm:p-6 text-left">
              <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400"></span>
                  <span className="h-3 w-3 rounded-full bg-yellow-400"></span>
                  <span className="h-3 w-3 rounded-full bg-green-400"></span>
                  <span className="ml-2 max-w-[160px] truncate text-xs font-mono text-[var(--muted)] sm:max-w-none">
                    workspace/prop_0912f.pdf
                  </span>
                </div>
                <span className="rounded-lg bg-[var(--accent-glow)] px-2.5 py-1 text-xs font-bold text-[var(--accent)]">
                  Analisi completata
                </span>
              </div>
              
              <div className="mt-4 grid gap-6 md:grid-cols-2">
                <div className="grid gap-3">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
                    <p className="text-xs font-bold uppercase text-[var(--muted)]">Cliente analizzato</p>
                    <p className="mt-1 text-lg font-black">KFC Corporation</p>
                    <p className="text-xs text-[var(--muted)]">Sito: https://www.kfc.it</p>
                  </div>
                  
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4">
                    <p className="text-xs font-bold uppercase text-[var(--muted)]">Budget stimato AI</p>
                    <p className="mt-1 text-2xl font-black text-[var(--accent)]">€ 14.500</p>
                    <p className="text-xs text-[var(--muted)]">Rationale: sviluppo portale, mobile app ordinazione, integrazione Stripe.</p>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] p-4 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase text-[var(--muted)]">Tavolozza del Brand</p>
                    <div className="mt-3 flex gap-2">
                      <span className="h-9 w-9 rounded-lg border border-[var(--line)]" style={{ background: "#E4002B" }} title="Primary Red" />
                      <span className="h-9 w-9 rounded-lg border border-[var(--line)]" style={{ background: "#111111" }} title="Accent Black" />
                      <span className="h-9 w-9 rounded-lg border border-[var(--line)]" style={{ background: "#F5F5F5" }} title="Off-White" />
                    </div>
                  </div>
                  <div className="mt-4 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)] flex items-center gap-1.5">
                    <Shield size={14} className="text-emerald-500" />
                    Sicurezza Multi-Tenant & Firma Crittografata
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-[var(--panel)] px-6 py-20 border-y border-[var(--line)]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              Cosa rende unico QuoteGen Engine
            </h2>
            <p className="mt-3 text-[var(--muted)]">
              Tutti i dettagli per chiudere vendite con un solo link.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="glass rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] mb-4">
                <Palette size={20} />
              </span>
              <h3 className="text-lg font-bold">Brand Scraper</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Analisi automatica del sito web del cliente per estrarre logo, colori aziendali e palette principali da applicare alla proposta.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] mb-4">
                <Zap size={20} />
              </span>
              <h3 className="text-lg font-bold">Stima del Budget AI</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Motore di analisi che stima la complessità dello scope negli appunti, fornendo una guida budgetaria intelligente basata sul mercato.
              </p>
            </div>

            <div className="glass rounded-2xl p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-[var(--accent)] mb-4">
                <FileCheck size={20} />
              </span>
              <h3 className="text-lg font-bold">Firma & Accettazione</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">
                I clienti visualizzano la proposta online e possono firmarla digitalmente all&apos;istante, aggiornando in tempo reale il tuo workspace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing / Comparison */}
      <section id="piani" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">Tariffe trasparenti</span>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Scegli il piano per il tuo team</h2>
            <p className="mt-2 text-[var(--muted)]">Nessun costo nascosto. Piani flessibili per ogni dimensione aziendale.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Starter */}
            <article className="glass rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black">Starter</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">Per piccoli team e professionisti</p>
                <p className="mt-4 text-3xl font-black">€29<span className="text-xs font-bold text-[var(--muted)]">/mese</span></p>
                <ul className="mt-6 space-y-2 text-sm text-[var(--muted)]">
                  <li>• 40 proposte/mese</li>
                  <li>• 3 membri workspace</li>
                  <li>• Link sicuro con scadenza</li>
                  <li>• Esportazione PDF nativa</li>
                </ul>
              </div>
              <Link href="/login" className="btn-secondary mt-8 w-full font-bold">
                Inizia ora
              </Link>
            </article>

            {/* Growth */}
            <article className="glass rounded-2xl p-6 border-2 border-[var(--accent)] flex flex-col justify-between relative">
              <span className="absolute -top-3 right-6 rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-bold text-white shadow-sm">
                Consigliato
              </span>
              <div>
                <h3 className="text-xl font-black">Growth</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">Il piano perfetto per le agenzie</p>
                <p className="mt-4 text-3xl font-black">€99<span className="text-xs font-bold text-[var(--muted)]">/mese</span></p>
                <ul className="mt-6 space-y-2 text-sm text-[var(--muted)]">
                  <li>• 300 proposte/mese</li>
                  <li>• 20 membri workspace</li>
                  <li>• Brand AI con vision integrata</li>
                  <li>• Checkout Stripe in tempo reale</li>
                </ul>
              </div>
              <Link href="/login" className="btn-primary mt-8 w-full font-bold">
                Scegli Growth
              </Link>
            </article>

            {/* Enterprise */}
            <article className="glass rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black">Enterprise</h3>
                <p className="mt-1 text-xs text-[var(--muted)]">Per esigenze su scala elevata</p>
                <p className="mt-4 text-3xl font-black">€399<span className="text-xs font-bold text-[var(--muted)]">/mese</span></p>
                <ul className="mt-6 space-y-2 text-sm text-[var(--muted)]">
                  <li>• 5000 proposte/mese</li>
                  <li>• 200 membri workspace</li>
                  <li>• Gestione avanzata del workflow</li>
                  <li>• Supporto prioritario via chat/video</li>
                </ul>
              </div>
              <Link href="/login" className="btn-secondary mt-8 w-full font-bold">
                Parla con un esperto
              </Link>
            </article>
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="mx-auto max-w-5xl px-6 pb-8">
        <SiteFooter />
      </div>
    </main>
  );
}

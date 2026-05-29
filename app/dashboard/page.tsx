"use client";

import { paletteToCssVars } from "@/lib/proposals/brand-theme";
import { SiteFooter } from "@/components/site-footer";
import { BadgeEuro, Check, ClipboardCopy, Download, Globe, Sparkles, Send, FileText, CheckCircle, Copy, Laptop, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

export default function DashboardPage() {
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [sector, setSector] = useState("");
  const [quoteFiles, setQuoteFiles] = useState<File[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [budgetNote, setBudgetNote] = useState("Il budget verrà calcolato dall'AI sulla base del preventivo caricato.");
  const [palette, setPalette] = useState<string[]>(["#0D9488", "#8B5CF6", "#F59E0B"]);
  const [brandMessage, setBrandMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [apiMessage, setApiMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [workspaceCount, setWorkspaceCount] = useState(0);
  const [planName, setPlanName] = useState("starter");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fileCount = useMemo(() => quoteFiles.length, [quoteFiles]);

  useEffect(() => {
    void refreshWorkspace();
    void refreshBilling();
  }, []);

  async function refreshWorkspace() {
    const response = await fetch("/api/workspaces");
    if (!response.ok) return;
    const payload = (await response.json()) as { workspaces: Array<{ id: string }> };
    setWorkspaceCount(payload.workspaces.length);
  }

  async function refreshBilling() {
    const response = await fetch("/api/billing/checkout");
    if (!response.ok) return;
    const payload = (await response.json()) as { current: { plan: string } };
    setPlanName(payload.current.plan);
  }

  async function analyzeBrand() {
    if (!website.trim()) {
      setBrandMessage("Inserisci prima il sito web del cliente.");
      return;
    }
    setIsAnalyzing(true);
    setBrandMessage("");
    try {
      const form = new FormData();
      form.append("website", website.trim());
      form.append("company", company.trim() || "Cliente");
      form.append("sector", sector.trim() || "Business");
      for (const file of quoteFiles) form.append("files", file);

      const response = await fetch("/api/analyze-site", { method: "POST", body: form });
      const payload = (await response.json()) as {
        palette?: string[];
        message?: string;
        estimatedBudget?: number;
        sectorSummary?: string;
        budgetRationale?: string;
      };
      if (!response.ok) {
        setBrandMessage("Analisi brand non riuscita. Puoi comunque inserire la palette manualmente.");
        return;
      }
      if (payload.palette?.length) setPalette(payload.palette);
      if (payload.estimatedBudget) {
        setBudget(payload.estimatedBudget);
        setBudgetNote(payload.budgetRationale || "Budget stimato dall'AI sulla base dello scope analizzato.");
      }
      if (payload.sectorSummary) setSector(payload.sectorSummary);
      setBrandMessage(payload.message || "Palette brand e informazioni cliente estratte con successo.");
    } catch {
      setBrandMessage("Errore durante l'analisi. Riprova.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function generateProposal() {
    if (!company.trim() || quoteFiles.length === 0) {
      setApiMessage("Compila i campi obbligatori: azienda e carica almeno un file di preventivo.");
      return;
    }
    setIsGenerating(true);
    setApiMessage("");
    try {
      if (website.trim() && !brandMessage) {
        await analyzeBrand();
      }

      const form = new FormData();
      form.append("company", company.trim());
      form.append("website", website.trim());
      form.append("sector", sector.trim() || "Business");
      form.append("palette", JSON.stringify(palette.map((color) => color.toUpperCase())));
      for (const file of quoteFiles) form.append("files", file);

      const proposalResponse = await fetch("/api/proposals", { method: "POST", body: form });
      const proposalPayload = (await proposalResponse.json()) as {
        link?: string;
        deployMessage?: string;
        budget?: number;
        error?: string;
      };
      if (!proposalResponse.ok) {
        setApiMessage(proposalPayload.error || "Errore nella creazione della proposta.");
        return;
      }
      if (proposalPayload.budget) setBudget(proposalPayload.budget);
      setShareLink(`${window.location.origin}${proposalPayload.link}`);
      setApiMessage(proposalPayload.deployMessage || "Proposta generata con successo. Il link per il cliente è pronto.");
    } catch {
      setApiMessage("Impossibile connettersi al server per la generazione. Verifica la configurazione.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function copyLink() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyColor(color: string) {
    await navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  }

  return (
    <div className="flex w-full flex-col gap-5 max-w-6xl mx-auto">
      
      {/* Premium Dashboard Header */}
      <header className="glass w-full overflow-x-hidden rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
            <Sparkles size={14} />
            <span>Generatore AI di Preventivi</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mt-1">Crea nuova proposta</h1>
          <p className="text-sm text-[var(--muted)] mt-1.5 max-w-xl">
            Inserisci i dati del cliente e i dettagli del lavoro. L&apos;intelligenza artificiale estrarrà la palette del brand, calcolerà il budget e scriverà un preventivo personalizzato.
          </p>
        </div>
        
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button 
            type="button" 
            onClick={() => {
              setCompany("");
              setWebsite("");
              setSector("");
              setQuoteFiles([]);
              if (fileInputRef.current) fileInputRef.current.value = "";
              setBudget(null);
              setShareLink("");
              setApiMessage("");
              setBrandMessage("");
            }}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-xs min-h-[2.5rem] sm:w-auto"
          >
            <RefreshCw size={14} />
            Svuota campi
          </button>
        </div>
      </header>

      <div className="grid w-full gap-5 sm:gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main Form Area */}
        <section className="grid w-full gap-5 sm:gap-6">
          
          {/* Step 1: Info Cliente */}
          <div className="glass w-full overflow-x-hidden rounded-2xl p-5 sm:p-6 grid gap-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--line)] text-xs font-bold text-[var(--foreground)]">1</span>
              <h2 className="text-lg font-black tracking-tight">Dati del Cliente</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide">
                Nome Azienda *
                <input
                  className="input"
                  required
                  placeholder="Es. KFC S.p.A."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide">
                Sito Web (opzionale)
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)] opacity-60" size={16} />
                  <input
                    className="input input-with-icon"
                    placeholder="https://www.kfc.it"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>
              </label>
            </div>

            {website.trim() && (
              <div className="flex flex-col gap-2 mt-2">
                <button
                  type="button"
                  className="btn-secondary flex items-center justify-center gap-2 text-xs py-2 min-h-[2.25rem] self-start"
                  onClick={analyzeBrand}
                  disabled={isAnalyzing}
                >
                  <Sparkles size={14} className="text-[var(--accent)]" />
                  {isAnalyzing ? "Analisi brand in corso..." : "Estrai Palette e Dettagli dal Sito"}
                </button>
                {brandMessage && (
                  <p className="text-xs font-medium text-[var(--muted)] bg-[var(--panel-strong)] rounded-lg p-2.5 border border-[var(--line)]">
                    {brandMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Dettagli Proposta */}
          <div className="glass w-full overflow-x-hidden rounded-2xl p-5 sm:p-6 grid gap-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--line)] text-xs font-bold text-[var(--foreground)]">2</span>
              <h2 className="text-lg font-black tracking-tight">Scope del Lavoro & Appunti</h2>
            </div>

            <label className="grid gap-1.5 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide">
              Settore di Attività
              <input
                className="input"
                placeholder="Es. Ristorazione / Fast Food / Delivery"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </label>

            <label className="grid gap-1.5 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide">
              Preventivo Grezzo (File) *
              <div
                className="input min-h-36 resize-y whitespace-pre-line break-words cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const files = Array.from(e.dataTransfer.files || []);
                  if (files.length) setQuoteFiles(files);
                }}
              >
                {quoteFiles.length
                  ? `File selezionati:\n${quoteFiles.map((f) => f.name).join("\n")}`
                  : "Clicca per caricare o trascina qui i file del preventivo (PDF, DOCX, TXT)."}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setQuoteFiles(files);
                }}
              />
            </label>
            <div className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:items-center text-xs text-[var(--muted)]">
              <span>Clicca o trascina i file per generare un preventivo di qualità.</span>
              <span className="font-mono">{fileCount} file</span>
            </div>
          </div>

          {/* Step 3: Generazione AI & Risultato */}
          <div className="glass w-full rounded-2xl p-5 sm:p-6 grid gap-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--line)] text-xs font-bold text-[var(--foreground)]">3</span>
              <h2 className="text-lg font-black tracking-tight">Genera & Pubblica</h2>
            </div>

            {/* Budget AI Card */}
            <div className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-4 flex items-center justify-between gap-4 shadow-sm">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider block">Budget Stimato AI</span>
                <p className="text-2xl sm:text-3xl font-black text-[var(--accent)] mt-0.5 break-words leading-tight">
                  {budget ? `€ ${budget.toLocaleString("it-IT")}` : "In attesa dell'AI..."}
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-1 truncate max-w-md" title={budgetNote}>
                  {budgetNote}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-[var(--accent)]">
                <BadgeEuro size={24} />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 mt-2">
              <button
                onClick={generateProposal}
                disabled={isGenerating || isAnalyzing}
                className="btn-primary w-full min-w-0 flex items-center justify-center gap-2 text-sm font-bold min-h-[3rem]"
              >
                {isGenerating ? (
                  <>
                    <Laptop className="animate-bounce" size={18} />
                    <span className="text-center leading-tight break-words">L&apos;AI sta compilando il preventivo...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span className="text-center leading-tight break-words">Compila & Genera Proposta Brandizzata</span>
                  </>
                )}
              </button>
            </div>

            {apiMessage && (
              <div className="rounded-xl border border-[var(--line)] bg-[var(--panel)] px-4 py-3.5 text-xs text-[var(--muted)] font-medium leading-relaxed">
                {apiMessage}
              </div>
            )}

            {/* share link presentation card */}
            {shareLink && (
              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 grid gap-3 animate-in fade-in duration-300">
                <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-xs">
                  <CheckCircle size={15} />
                  <span>Proposta commercializzata con successo!</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    readOnly
                    className="input text-xs font-mono select-all bg-[var(--panel-strong)] flex-1 min-h-[2.25rem] py-1"
                    value={shareLink}
                  />
                  <button
                    onClick={copyLink}
                    className="btn-secondary h-9 w-9 p-0 flex items-center justify-center shrink-0"
                    title="Copia link"
                  >
                    {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  </button>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 mt-1">
                  <a
                    href={shareLink}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs min-h-[2.25rem] py-1.5 flex-1 flex items-center justify-center gap-1.5 font-bold"
                  >
                    <FileText size={14} />
                    Apri Proposta Cliente
                  </a>
                  <button
                    onClick={() => window.print()}
                    className="btn-secondary text-xs min-h-[2.25rem] py-1.5 flex items-center justify-center gap-1.5 font-bold"
                  >
                    <Download size={14} />
                    Stampa / PDF
                  </button>
                </div>
              </div>
            )}

          </div>

        </section>

        {/* Sidebar Summary & Brand Area */}
        <aside className="grid w-full content-start gap-5 sm:gap-6">
          
          {/* Brand Palette */}
          <div className="glass w-full overflow-x-hidden rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] border-b border-[var(--line)] pb-2 mb-3">
              Palette del Brand
            </h3>
            <p className="text-xs text-[var(--muted)] mb-4">
              Ispirata al sito web del cliente. Clicca su un cerchio per copiare il codice HEX.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {palette.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => copyColor(color)}
                  className="group relative aspect-square w-full flex-col items-center justify-center rounded-xl border border-[var(--line)] shadow-sm transition-transform active:scale-95"
                  style={{ background: color }}
                  title={`Copia ${color}`}
                >
                  <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 text-[10px] font-bold text-white uppercase font-mono">
                    {copiedColor === color ? <Check size={14} /> : "copia"}
                  </span>
                </button>
              ))}
            </div>
            
            {copiedColor && (
              <p className="text-[10px] text-emerald-600 font-bold mt-3 animate-pulse">
                HEX {copiedColor} copiato negli appunti!
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="glass w-full overflow-x-hidden rounded-2xl p-5 sm:p-6">
            <h3 className="text-sm font-black uppercase tracking-wider text-[var(--muted)] border-b border-[var(--line)] pb-2 mb-3">
              Limiti & Workspace
            </h3>
            
            <div className="grid gap-3 text-xs">
              <div className="flex flex-col items-start gap-1 py-1 border-b border-[var(--line)]/50 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[var(--muted)]">Proposte create</span>
                <strong className="text-[var(--foreground)] w-fit">{workspaceCount}</strong>
              </div>
              
              <div className="flex flex-col items-start gap-1 py-1 border-b border-[var(--line)]/50 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-[var(--muted)]">Piano Abbonamento</span>
                <span className="rounded-full bg-[var(--accent-glow)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--accent)] w-fit">
                  {planName}
                </span>
              </div>
            </div>

            <Link href="/dashboard/billing" className="btn-secondary w-full text-xs font-bold py-2 min-h-[2.5rem] mt-5 flex items-center justify-center gap-1.5">
              <Laptop size={14} />
              Gestisci Piani Stripe
            </Link>
          </div>

        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}

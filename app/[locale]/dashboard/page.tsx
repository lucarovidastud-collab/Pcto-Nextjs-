"use client";

import { paletteToCssVars } from "@/lib/proposals/brand-theme";
import { SiteFooter } from "@/components/site-footer";
import { BadgeEuro, Check, ClipboardCopy, Download, Globe, Sparkles, Send, FileText, CheckCircle, Copy, Laptop, RefreshCw } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BrandPaletteEditor } from "@/components/dashboard/brand-palette-editor";
import { ProposalStylePicker } from "@/components/dashboard/proposal-style-picker";
import { GenerationProgress } from "@/components/dashboard/generation-progress";
import { sanitizePaletteInput } from "@/lib/utils/palette";
import { DEFAULT_PROPOSAL_STYLE, type ProposalStyleId } from "@/lib/proposals/styles";
import { broadcastPalette } from "@/lib/proposals/palette-channel";
import { UsageMeter } from "@/components/billing/usage-meter";
import { openStripeBillingPortal } from "@/lib/billing/open-portal";
import { slugifyProposalLink } from "@/lib/proposals/slug";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [company, setCompany] = useState("");
  const [website, setWebsite] = useState("");
  const [sector, setSector] = useState("");
  const [quoteFiles, setQuoteFiles] = useState<File[]>([]);
  const [budget, setBudget] = useState<number | null>(null);
  const [budgetNote, setBudgetNote] = useState<string | null>(null);
  const [palette, setPalette] = useState<string[]>(["#0D9488", "#8B5CF6", "#F59E0B"]);
  const [proposalStyle, setProposalStyle] = useState<ProposalStyleId>(DEFAULT_PROPOSAL_STYLE);
  const [brandMessage, setBrandMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genPercent, setGenPercent] = useState(0);
  const [genLabel, setGenLabel] = useState("");
  const [linkSlug, setLinkSlug] = useState("");
  const [linkSlugTouched, setLinkSlugTouched] = useState(false);
  const [slugHint, setSlugHint] = useState("");
  const [apiMessage, setApiMessage] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [proposalsUsed, setProposalsUsed] = useState(0);
  const [proposalLimit, setProposalLimit] = useState<number | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [planName, setPlanName] = useState("none");
  const [billingNotice, setBillingNotice] = useState("");
  const [openingPortal, setOpeningPortal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const portalReturn = searchParams.get("billing") === "portal";
  const fileCount = useMemo(() => quoteFiles.length, [quoteFiles]);
  const brandCssVars = useMemo(() => paletteToCssVars(palette), [palette]);

  const shareToken = useMemo(() => {
    if (!shareLink) return "";
    const match = shareLink.split("/p/")[1];
    return match ? match.split(/[?#]/)[0] : "";
  }, [shareLink]);

  useEffect(() => {
    if (!proposalId || !shareToken) return;
    const next = sanitizePaletteInput(palette);
    const timer = setTimeout(() => {
      void fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ palette: next })
      }).then((res) => {
        if (res.ok) broadcastPalette(shareToken, next);
      });
    }, 450);
    return () => clearTimeout(timer);
  }, [palette, proposalId, shareToken]);

  async function refreshBilling() {
    const response = await fetch("/api/billing/checkout");
    if (!response.ok) return;
    const payload = (await response.json()) as {
      current: { plan: string };
      limits: { proposalLimit: number } | null;
      usage: { proposalsThisMonth: number };
      hasActiveSubscription: boolean;
    };
    setPlanName(payload.current.plan);
    setProposalsUsed(payload.usage.proposalsThisMonth);
    setProposalLimit(payload.limits?.proposalLimit ?? null);
    setHasActiveSubscription(payload.hasActiveSubscription);
  }

  useEffect(() => {
    void refreshBilling();
  }, []);

  useEffect(() => {
    if (linkSlugTouched || !company.trim()) return;
    setLinkSlug(slugifyProposalLink(company));
  }, [company, linkSlugTouched]);

  async function checkSlugAvailability(slug: string) {
    const normalized = slugifyProposalLink(slug);
    if (normalized.length < 2) {
      setSlugHint("");
      return;
    }
    const res = await fetch(`/api/proposals/check-slug?slug=${encodeURIComponent(normalized)}`);
    const payload = (await res.json()) as { available?: boolean; error?: string | null; slug?: string };
    if (payload.available) {
      setSlugHint(t("slugAvailable", { slug: payload.slug || normalized }));
    } else {
      setSlugHint(payload.error || t("slugUnavailable"));
    }
  }

  useEffect(() => {
    if (portalReturn) {
      void refreshBilling();
    }
  }, [portalReturn]);

  async function handleOpenPortal() {
    setOpeningPortal(true);
    setBillingNotice("");
    const result = await openStripeBillingPortal(t("portalUnavailable") as string);
    if (!result.ok) {
      setBillingNotice(result.error);
      setOpeningPortal(false);
    }
  }

  async function analyzeBrand(): Promise<string[] | null> {
    if (!website.trim()) {
      setBrandMessage(t("enterWebsite"));
      return null;
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
        error?: string;
      };
      if (!response.ok) {
        if (payload.error) {
          if (payload.error === "subscription_required") {
            router.push("/dashboard/subscribe");
            return null;
          }
          if (payload.error === "proposal_limit_reached") {
            router.push("/dashboard/billing?limit=reached");
            return null;
          }
        }
        setBrandMessage(t("brandFailed"));
        return null;
      }
      const resolved = payload.palette?.length ? sanitizePaletteInput(payload.palette) : null;
      if (resolved?.length) setPalette(resolved);
      if (payload.estimatedBudget) {
        setBudget(payload.estimatedBudget);
        setBudgetNote(payload.budgetRationale || t("budgetFromAI"));
      }
      if (payload.sectorSummary) setSector(payload.sectorSummary);
      setBrandMessage(payload.message || t("brandSuccess"));
      return resolved;
    } catch {
      setBrandMessage(t("brandError"));
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function generateProposal() {
    if (!company.trim() || quoteFiles.length === 0) {
      setApiMessage(t("errRequired"));
      return;
    }
    setIsGenerating(true);
    setGenPercent(0);
    setGenLabel(t("generationStart"));
    setApiMessage("");
    try {
      let paletteForSubmit = palette;
      if (website.trim()) {
        const extracted = await analyzeBrand();
        if (extracted?.length) paletteForSubmit = extracted;
      }

      const form = new FormData();
      form.append("company", company.trim());
      form.append("website", website.trim());
      form.append("sector", sector.trim() || "Business");
      form.append("linkSlug", slugifyProposalLink(linkSlug || company));
      form.append("style", proposalStyle);
      form.append("palette", JSON.stringify(sanitizePaletteInput(paletteForSubmit)));
      for (const file of quoteFiles) form.append("files", file);

      const proposalResponse = await fetch("/api/proposals/stream", { method: "POST", body: form });
      if (!proposalResponse.ok || !proposalResponse.body) {
        const errPayload = (await proposalResponse.json().catch(() => ({}))) as { error?: string };
        if (errPayload.error === "subscription_required") {
          router.push("/dashboard/subscribe");
          return;
        }
        if (errPayload.error === "proposal_limit_reached") {
          router.push("/dashboard/billing?limit=reached");
          return;
        }
        setApiMessage(errPayload.error || t("errGeneration"));
        return;
      }

      const reader = proposalResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let completed = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const evt = JSON.parse(line) as {
            type: string;
            percent?: number;
            label?: string;
            error?: string;
            link?: string;
            id?: string;
            budget?: number;
            deployMessage?: string;
            contentSource?: "ai" | "fallback";
            aiError?: string;
            palette?: string[];
          };

          if (evt.type === "progress" && typeof evt.percent === "number") {
            setGenPercent(evt.percent);
            setGenLabel(evt.label || t("elaborating"));
            if (evt.palette?.length) setPalette(sanitizePaletteInput(evt.palette));
          }
          if (evt.type === "error") {
            if (evt.error === "subscription_required") {
              router.push("/dashboard/subscribe");
              return;
            }
            if (evt.error === "proposal_limit_reached") {
              router.push("/dashboard/billing?limit=reached");
              return;
            }
            setApiMessage(evt.error || t("errGeneration"));
            return;
          }
          if (evt.type === "complete") {
            completed = true;
            void refreshBilling();
            if (evt.budget) setBudget(evt.budget);
            if (evt.palette?.length) setPalette(sanitizePaletteInput(evt.palette));
            setShareLink(`${window.location.origin}${evt.link}`);
            setProposalId(evt.id || null);
            const base = evt.deployMessage || t("successShare");
            setApiMessage(
              evt.contentSource === "fallback"
                ? `${base} ${t("aiFallbackWarning")}${evt.aiError ? ` (${evt.aiError})` : ""}`
                : base
            );
          }
        }
      }

      if (!completed) {
        setApiMessage(t("errGenerationAborted"));
      }
    } catch {
      setApiMessage(t("errConnection"));
    } finally {
      setIsGenerating(false);
      setGenPercent(0);
      setGenLabel("");
    }
  }

  async function copyLink() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function printProposal() {
    if (!shareLink) return;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.top = "-9999px";
    iframe.style.left = "-9999px";
    iframe.style.width = "1px";
    iframe.style.height = "1px";
    iframe.style.opacity = "0";
    iframe.src = `${shareLink}?print=true`;
    document.body.appendChild(iframe);
    iframe.addEventListener("load", () => {
      try {
        iframe.contentWindow?.print();
      } catch {
        // fallback: open in new tab if iframe print fails (cross-origin quirks)
        window.open(`${shareLink}?print=true`, "_blank");
      }
      setTimeout(() => document.body.removeChild(iframe), 3000);
    });
  }

  return (
    <div className="flex w-full flex-col gap-5 max-w-6xl mx-auto">
      {portalReturn ? (
        <p className="glass-premium rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3.5 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
          {t("portalReturn")}
        </p>
      ) : null}
      {billingNotice ? (
        <p className="rounded-xl border border-red-200 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-600">
          {billingNotice}
        </p>
      ) : null}

      {/* Premium Dashboard Header */}
      <header className="glass w-full overflow-x-hidden rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[var(--accent)] uppercase tracking-widest">
            <Sparkles size={14} />
            <span>{t("aiGeneratorBadge")}</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight mt-1">{t("createTitle")}</h1>
          <p className="text-sm text-[var(--muted)] mt-1.5 max-w-xl">{t("createSubtitle")}</p>
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
              setProposalId(null);
              setApiMessage("");
              setBrandMessage("");
            }}
            className="btn-secondary w-full flex items-center justify-center gap-2 text-xs min-h-[2.5rem] sm:w-auto"
          >
            <RefreshCw size={14} />
            {t("clearFields")}
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
              <h2 className="text-lg font-black tracking-tight">{t("step1Title")}</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide">
                {t("fieldCompanyName")}
                <input
                  className="input"
                  required
                  placeholder="Es. King Inox S.r.l."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </label>

              <label className="grid gap-1.5 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide sm:col-span-2">
                {t("fieldCustomLink")}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center">
                  <span className="text-[11px] font-mono text-[var(--muted)] shrink-0">…/p/</span>
                  <input
                    className="input font-mono text-sm"
                    placeholder="king-inox"
                    value={linkSlug}
                    onChange={(e) => {
                      setLinkSlugTouched(true);
                      setLinkSlug(e.target.value);
                    }}
                    onBlur={() => void checkSlugAvailability(linkSlug)}
                  />
                </div>
                {slugHint ? (
                  <span className="text-[10px] font-semibold text-[var(--muted)] normal-case tracking-normal">
                    {slugHint}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-[var(--muted)] normal-case tracking-normal">
                    {t("slugExample")}
                  </span>
                )}
              </label>

              <label className="grid gap-1.5 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide">
                {t("fieldWebsite")}
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
                  {isAnalyzing ? t("analyzingBrand") : t("analyzeBrand")}
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
              <h2 className="text-lg font-black tracking-tight">{t("step2Title")}</h2>
            </div>

            <label className="grid gap-1.5 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide">
              {t("fieldSector")}
              <input
                className="input"
                placeholder="Es. Ristorazione / Fast Food / Delivery"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
              />
            </label>

            <label className="grid gap-1.5 text-xs font-extrabold text-[var(--muted)] uppercase tracking-wide">
              {t("fieldFiles")}
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
                  ? `${t("filesSelected")}\n${quoteFiles.map((f) => f.name).join("\n")}`
                  : t("filesDropHint")}
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
              <span>{t("filesHelp")}</span>
              <span className="font-mono">{fileCount} file</span>
            </div>
          </div>

          {/* Step 3: Generazione AI & Risultato */}
          <div className="glass w-full rounded-2xl p-5 sm:p-6 grid gap-4">
            <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[var(--line)] text-xs font-bold text-[var(--foreground)]">3</span>
              <h2 className="text-lg font-black tracking-tight">{t("step3Title")}</h2>
            </div>

            {/* Selettore stile preventivo */}
            <div className="grid gap-2">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-[var(--muted)]">{t("styleTitle")}</p>
                <p className="text-[11px] text-[var(--muted)]">{t("styleSubtitle")}</p>
              </div>
              <ProposalStylePicker value={proposalStyle} onChange={setProposalStyle} />
            </div>

            {/* Budget AI Card */}
            <div className="w-full min-w-0 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-4 flex items-center justify-between gap-4 shadow-sm">
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-[var(--muted)] uppercase tracking-wider block">{t("budgetLabel")}</span>
                <p className="text-2xl sm:text-3xl font-black text-[var(--accent)] mt-0.5 break-words leading-tight">
                  {budget ? `€ ${budget.toLocaleString(locale)}` : t("budgetWaiting")}
                </p>
                <p className="text-[11px] text-[var(--muted)] mt-1 truncate max-w-md" title={budgetNote ?? undefined}>
                  {budgetNote ?? t("budgetFromFile")}
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-glow)] text-[var(--accent)]">
                <BadgeEuro size={24} />
              </div>
            </div>

            <GenerationProgress percent={genPercent} label={genLabel} active={isGenerating} />

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
                    <span className="text-center leading-tight break-words">
                      {t("generatingBtn", { percent: genPercent })}
                    </span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span className="text-center leading-tight break-words">{t("generateBtn")}</span>
                  </>
                )}
              </button>
              <Link
                href="/dashboard/history"
                className="btn-secondary w-full sm:w-auto text-sm font-bold flex items-center justify-center gap-2 min-h-[3rem]"
              >
                <FileText size={16} />
                {t("historyBtn")}
              </Link>
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
                  <span>{t("successShare")}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    readOnly
                    className="input text-xs font-mono select-all bg-[var(--panel-strong)] flex-1 min-h-[2.25rem] py-1"
                    value={shareLink}
                  />
                  <button
                    onClick={copyLink}
                    className="btn-secondary text-xs min-h-[2.25rem] px-3 py-1.5 flex items-center justify-center gap-1.5 font-bold shrink-0"
                    title={t("copyLinkBtn")}
                  >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    {copied ? t("linkCopied") : t("copyLinkBtn")}
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
                    {t("openProposal")}
                  </a>
                  <button
                    onClick={printProposal}
                    className="btn-secondary text-xs min-h-[2.25rem] py-1.5 flex items-center justify-center gap-1.5 font-bold"
                  >
                    <Download size={14} />
                    {t("printPdf")}
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
              {t("paletteTitle")}
            </h3>
            <p className="text-xs text-[var(--muted)] mb-4">
              {t("paletteDesc")}
            </p>
            <div
              className="mb-4 h-2 w-full rounded-full"
              style={{ ...brandCssVars, background: "var(--brand-gradient)" } as CSSProperties}
              aria-hidden
            />
            <BrandPaletteEditor
              palette={palette}
              onChange={(next) => setPalette(sanitizePaletteInput(next))}
            />
            {shareLink ? (
              <div className="mt-4 grid gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  {t("paletteLivePreview")}
                </p>
                <p className="text-xs leading-relaxed text-[var(--muted)]">{t("paletteLiveHint")}</p>
                <a
                  href={shareLink}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary text-xs min-h-[2.25rem] py-1.5 flex items-center justify-center gap-1.5 font-bold"
                >
                  <FileText size={14} />
                  {t("openProposal")}
                </a>
              </div>
            ) : null}
          </div>

          {/* Abbonamento */}
          <div className="glass-premium w-full overflow-x-hidden rounded-2xl p-5 sm:p-6">
            <h3 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[var(--muted)] border-b border-[var(--line)] pb-2.5 mb-4">
              {t("subscriptionTitle")}
            </h3>

            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-xs font-bold text-[var(--muted)]">{t("planLabel")}</span>
              <span className="rounded-full bg-[var(--accent-glow)] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                {planName === "none" ? t("noPlan") : planName}
              </span>
            </div>

            {hasActiveSubscription && proposalLimit !== null ? (
              <UsageMeter used={proposalsUsed} limit={proposalLimit} compact />
            ) : (
              <p className="text-[11px] font-medium leading-relaxed text-[var(--muted)]">
                {t("activateHint")}
              </p>
            )}

            {hasActiveSubscription ? (
              <button
                type="button"
                disabled={openingPortal}
                onClick={() => void handleOpenPortal()}
                className="btn-secondary w-full text-xs font-bold py-2 min-h-[2.5rem] mt-5 flex items-center justify-center gap-1.5"
              >
                <Laptop size={14} />
                {openingPortal ? t("openingPortal") : t("manageSub")}
              </button>
            ) : (
              <Link
                href="/dashboard/subscribe"
                className="btn-primary w-full text-xs font-bold py-2 min-h-[2.5rem] mt-5 flex items-center justify-center gap-1.5"
              >
                {t("choosePlan")}
              </Link>
            )}
            <Link
              href={hasActiveSubscription ? "/dashboard/billing" : "/dashboard/subscribe"}
              className="mt-2 block text-center text-[10px] font-bold text-[var(--muted)] underline-offset-2 hover:underline hover:text-[var(--foreground)]"
            >
              {hasActiveSubscription ? t("comparePlans") : t("viewPricing")}
            </Link>
          </div>

        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}

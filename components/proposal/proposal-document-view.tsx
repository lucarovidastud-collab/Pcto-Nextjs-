"use client";

import type { ReactNode } from "react";
import { RichText } from "@/components/proposal/rich-text";
import {
  documentNavSections,
  type ProposalDocument,
  type ProposalDocumentSection
} from "@/lib/proposals/document-schema";
import type { ProposalStyleId } from "@/lib/proposals/styles";
import { CheckCircle2, Sparkles } from "lucide-react";

type Props = {
  document: ProposalDocument;
  style?: string;
  budget: number;
};

function sectionAnchor(index: number) {
  return `sezione-${index}`;
}

function SectionShell({
  id,
  children,
  variant = "card"
}: {
  id?: string;
  children: ReactNode;
  variant?: "card" | "highlight" | "hero";
}) {
  const base =
    variant === "hero"
      ? "relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[color-mix(in_srgb,var(--brand-primary)_28%,var(--line))] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-primary)_14%,var(--panel-strong))] via-[var(--panel-strong)] to-[color-mix(in_srgb,var(--brand-secondary,var(--brand-primary))_10%,var(--panel-strong))] p-6 sm:p-10 shadow-lg"
      : variant === "highlight"
        ? "rounded-2xl border border-[color-mix(in_srgb,var(--brand-primary)_35%,var(--line))] bg-gradient-to-r from-[color-mix(in_srgb,var(--brand-primary)_12%,var(--panel-strong))] to-[color-mix(in_srgb,var(--brand-secondary,var(--brand-primary))_8%,var(--panel-strong))] p-6 sm:p-8 shadow-md"
        : "rounded-2xl border border-[color-mix(in_srgb,var(--brand-primary)_18%,var(--line))] bg-[color-mix(in_srgb,var(--brand-primary)_5%,var(--panel-strong))] p-6 sm:p-8 shadow-sm transition-shadow hover:shadow-md";

  return (
    <section id={id} className={`scroll-mt-24 ${base}`}>
      {children}
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="brand-heading mb-4 text-xl font-black tracking-tight text-[var(--foreground)] sm:text-2xl">
      {children}
    </h3>
  );
}

function renderSection(section: ProposalDocumentSection, navIndex: number) {
  switch (section.type) {
    case "hero":
      return (
        <SectionShell key="hero" variant="hero">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
            <Sparkles size={14} className="brand-accent-icon" />
            <span>Proposta commerciale</span>
          </div>
          <h2 className="brand-heading text-2xl font-black leading-tight sm:text-4xl">
            <RichText text={section.title} />
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
            <RichText text={section.lead} />
          </p>
        </SectionShell>
      );

    case "kpis":
      return (
        <div
          key="kpis"
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {section.items.map((item, i) => (
            <div
              key={i}
              className="rounded-2xl border border-[color-mix(in_srgb,var(--brand-primary)_22%,var(--line))] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-primary)_16%,var(--panel-strong))] to-[var(--panel-strong)] px-5 py-6 text-center shadow-sm"
            >
              <p className="text-2xl font-black text-[var(--brand-primary)] sm:text-3xl">
                <RichText text={item.value} />
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <RichText text={item.label} />
              </p>
            </div>
          ))}
        </div>
      );

    case "text":
      return (
        <SectionShell key={`text-${navIndex}`} id={sectionAnchor(navIndex)}>
          <SectionTitle>
            <RichText text={section.title} />
          </SectionTitle>
          <div className="space-y-3 text-sm leading-relaxed text-[var(--foreground)] sm:text-base">
            {section.paragraphs.map((p, i) => (
              <p key={i}>
                <RichText text={p} />
              </p>
            ))}
          </div>
        </SectionShell>
      );

    case "list":
      return (
        <SectionShell key={`list-${navIndex}`} id={sectionAnchor(navIndex)}>
          <SectionTitle>
            <RichText text={section.title} />
          </SectionTitle>
          <ul className="space-y-3">
            {section.items.map((item, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 text-sm leading-relaxed"
              >
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[var(--brand-primary)]" />
                <span>
                  {item.lead ? (
                    <>
                      <strong className="font-bold text-[var(--foreground)]">
                        <RichText text={item.lead} />
                      </strong>
                      <span className="text-[var(--muted)]"> — </span>
                    </>
                  ) : null}
                  <RichText text={item.body} />
                </span>
              </li>
            ))}
          </ul>
        </SectionShell>
      );

    case "timeline":
      return (
        <SectionShell key={`timeline-${navIndex}`} id={sectionAnchor(navIndex)}>
          <SectionTitle>
            <RichText text={section.title} />
          </SectionTitle>
          {/* Stessa struttura/CSS della timeline HTML legacy: numeri via ::before */}
          <ol className="proposal-timeline">
            {section.steps.map((step, i) => (
              <li key={i}>
                <strong className="block">
                  <RichText text={step.title} />
                </strong>
                <span className="mt-1 block text-sm leading-relaxed text-[var(--muted)]">
                  <RichText text={step.description} />
                </span>
              </li>
            ))}
          </ol>
        </SectionShell>
      );

    case "pricing":
      return (
        <SectionShell key={`pricing-${navIndex}`} id={sectionAnchor(navIndex)}>
          <SectionTitle>
            <RichText text={section.title} />
          </SectionTitle>
          <div className="overflow-x-auto rounded-xl border border-[var(--line)]">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--brand-primary)_8%,var(--panel-strong))]">
                  <th className="px-4 py-3 font-bold text-[var(--foreground)]">Descrizione servizio</th>
                  <th className="px-4 py-3 text-right font-bold text-[var(--foreground)]">Importo</th>
                </tr>
              </thead>
              <tbody>
                {section.rows.map((row, i) => {
                  const isTotal = /^totale\b/i.test(row.description);
                  return (
                    <tr
                      key={i}
                      className={
                        isTotal
                          ? "border-t-2 border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,var(--panel-strong))] font-bold"
                          : i % 2 === 0
                            ? "border-b border-[var(--line)] bg-[var(--panel-strong)]"
                            : "border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--brand-primary)_3%,var(--panel-strong))]"
                      }
                    >
                      <td className="px-4 py-3">
                        <RichText text={row.description} />
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap text-[var(--brand-primary)]">
                        <RichText text={row.amount || ""} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SectionShell>
      );

    case "highlight":
      return (
        <SectionShell key={`highlight-${navIndex}`} id={sectionAnchor(navIndex)} variant="highlight">
          <SectionTitle>
            <RichText text={section.title} />
          </SectionTitle>
          <ul className="grid gap-2 sm:grid-cols-2">
            {section.items.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-2 rounded-lg bg-[var(--panel-strong)]/60 px-3 py-2 text-sm font-medium"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-primary)]" />
                <RichText text={item} />
              </li>
            ))}
          </ul>
        </SectionShell>
      );

    case "grid":
      return (
        <SectionShell key={`grid-${navIndex}`} id={sectionAnchor(navIndex)}>
          <SectionTitle>
            <RichText text={section.title} />
          </SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            {section.cards.map((card, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm"
              >
                <h4 className="mb-2 font-bold text-[var(--brand-primary)]">
                  <RichText text={card.title} />
                </h4>
                <p className="text-sm leading-relaxed text-[var(--muted)]">
                  <RichText text={card.body} />
                </p>
              </div>
            ))}
          </div>
        </SectionShell>
      );

    default:
      return null;
  }
}

export function ProposalDocumentView({ document, style, budget }: Props) {
  const styleId = (style || "moderno") as ProposalStyleId;
  let navIndex = 0;

  const blocks = document.sections.map((section) => {
    if (section.type !== "hero" && section.type !== "kpis") {
      navIndex += 1;
      return renderSection(section, navIndex);
    }
    return renderSection(section, 0);
  });

  return (
    <div
      className={`proposal-doc proposal-doc--${styleId} flex flex-col gap-6 sm:gap-8`}
      data-budget={budget}
    >
      {blocks}
    </div>
  );
}

export function ProposalDocumentIndex({
  document,
  indexTitle
}: {
  document: ProposalDocument;
  indexTitle: string;
}) {
  const sections = documentNavSections(document);
  if (sections.length < 3) return null;

  return (
    <nav className="proposal-index no-print mb-8 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-5" aria-label={indexTitle}>
      <p className="proposal-index-title mb-3 text-xs font-black uppercase tracking-widest text-[var(--muted)]">
        {indexTitle}
      </p>
      <ol className="grid gap-1 sm:grid-cols-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)] hover:text-[var(--brand-primary)]"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

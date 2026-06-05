"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedKpiValue } from "@/components/proposal/animated-kpi-value";
import { RichText } from "@/components/proposal/rich-text";
import {
  fadeIn,
  fadeUp,
  MotionHoverCard,
  MotionItem,
  MotionLi,
  MotionReveal,
  MotionSparkle,
  MotionStagger,
  MotionTableRow,
  scaleIn,
  slideInLeft,
  stagger
} from "@/components/proposal/proposal-motion";
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
      ? "proposal-doc-hero relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[color-mix(in_srgb,var(--brand-primary)_28%,var(--line))] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-primary)_14%,var(--panel-strong))] via-[var(--panel-strong)] to-[color-mix(in_srgb,var(--brand-secondary,var(--brand-primary))_10%,var(--panel-strong))] p-6 sm:p-10 shadow-lg"
      : variant === "highlight"
        ? "rounded-2xl border border-[color-mix(in_srgb,var(--brand-primary)_35%,var(--line))] bg-gradient-to-r from-[color-mix(in_srgb,var(--brand-primary)_12%,var(--panel-strong))] to-[color-mix(in_srgb,var(--brand-secondary,var(--brand-primary))_8%,var(--panel-strong))] p-6 sm:p-8 shadow-md"
        : "rounded-2xl border border-[color-mix(in_srgb,var(--brand-primary)_18%,var(--line))] bg-[color-mix(in_srgb,var(--brand-primary)_5%,var(--panel-strong))] p-6 sm:p-8 shadow-sm transition-shadow duration-300 hover:shadow-lg";

  return (
    <section id={id} className={`scroll-mt-24 ${base}`}>
      {variant === "hero" ? <div className="proposal-doc-hero-glow pointer-events-none absolute inset-0" aria-hidden /> : null}
      <div className="relative">{children}</div>
    </section>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <h3 className="brand-heading mb-4 text-xl font-black tracking-tight text-[var(--foreground)] sm:text-2xl">
        {children}
      </h3>
    );
  }

  return (
    <motion.h3
      className="brand-heading mb-4 text-xl font-black tracking-tight text-[var(--foreground)] sm:text-2xl"
      initial={{ opacity: 0, x: -12 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.h3>
  );
}

function renderSection(section: ProposalDocumentSection, navIndex: number) {
  switch (section.type) {
    case "hero":
      return (
        <MotionReveal key="hero" variants={scaleIn}>
          <SectionShell variant="hero">
            <MotionStagger className="flex flex-col" staggerChildren={0.12}>
              <MotionItem variants={fadeIn}>
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                  <MotionSparkle className="inline-flex">
                    <Sparkles size={14} className="brand-accent-icon" />
                  </MotionSparkle>
                  <span>Proposta commerciale</span>
                </div>
              </MotionItem>
              <MotionItem variants={fadeUp}>
                <h2 className="brand-heading text-2xl font-black leading-tight sm:text-4xl">
                  <RichText text={section.title} />
                </h2>
              </MotionItem>
              <MotionItem variants={fadeUp}>
                <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[var(--muted)] sm:text-base">
                  <RichText text={section.lead} />
                </p>
              </MotionItem>
            </MotionStagger>
          </SectionShell>
        </MotionReveal>
      );

    case "kpis":
      return (
        <MotionStagger key="kpis" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" staggerChildren={0.1}>
          {section.items.map((item, i) => (
            <MotionHoverCard
              key={i}
              className="rounded-2xl border border-[color-mix(in_srgb,var(--brand-primary)_22%,var(--line))] bg-gradient-to-br from-[color-mix(in_srgb,var(--brand-primary)_16%,var(--panel-strong))] to-[var(--panel-strong)] px-5 py-6 text-center shadow-sm"
            >
              <p className="text-2xl font-black text-[var(--brand-primary)] sm:text-3xl">
                <AnimatedKpiValue text={item.value} />
              </p>
              <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <RichText text={item.label} />
              </p>
            </MotionHoverCard>
          ))}
        </MotionStagger>
      );

    case "text":
      return (
        <MotionReveal key={`text-${navIndex}`}>
          <SectionShell id={sectionAnchor(navIndex)}>
            <SectionTitle>
              <RichText text={section.title} />
            </SectionTitle>
            <MotionStagger className="space-y-3 text-sm leading-relaxed text-[var(--foreground)] sm:text-base">
              {section.paragraphs.map((p, i) => (
                <MotionItem key={i} variants={fadeIn}>
                  <p>
                    <RichText text={p} />
                  </p>
                </MotionItem>
              ))}
            </MotionStagger>
          </SectionShell>
        </MotionReveal>
      );

    case "list":
      return (
        <MotionReveal key={`list-${navIndex}`}>
          <SectionShell id={sectionAnchor(navIndex)}>
            <SectionTitle>
              <RichText text={section.title} />
            </SectionTitle>
            <MotionStagger as="ul" className="space-y-3" staggerChildren={0.07}>
              {section.items.map((item, i) => (
                <MotionLi
                  key={i}
                  variants={slideInLeft}
                  className="flex gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-4 py-3 text-sm leading-relaxed transition-colors duration-300 hover:border-[color-mix(in_srgb,var(--brand-primary)_35%,var(--line))] hover:bg-[color-mix(in_srgb,var(--brand-primary)_4%,var(--panel-strong))]"
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
                </MotionLi>
              ))}
            </MotionStagger>
          </SectionShell>
        </MotionReveal>
      );

    case "timeline":
      return (
        <MotionReveal key={`timeline-${navIndex}`}>
          <SectionShell id={sectionAnchor(navIndex)}>
            <SectionTitle>
              <RichText text={section.title} />
            </SectionTitle>
            <MotionStagger as="ol" className="proposal-timeline" staggerChildren={0.12}>
              {section.steps.map((step, i) => (
                <MotionLi key={i} variants={slideInLeft}>
                  <strong className="block">
                    <RichText text={step.title} />
                  </strong>
                  <span className="mt-1 block text-sm leading-relaxed text-[var(--muted)]">
                    <RichText text={step.description} />
                  </span>
                </MotionLi>
              ))}
            </MotionStagger>
          </SectionShell>
        </MotionReveal>
      );

    case "pricing":
      return (
        <MotionReveal key={`pricing-${navIndex}`}>
          <SectionShell id={sectionAnchor(navIndex)}>
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
                <MotionStagger as="tbody" staggerChildren={0.06}>
                  {section.rows.map((row, i) => {
                    const isTotal = /^totale\b/i.test(row.description);
                    return (
                      <MotionTableRow
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
                          {isTotal ? (
                            <AnimatedKpiValue text={row.amount || ""} />
                          ) : (
                            <RichText text={row.amount || ""} />
                          )}
                        </td>
                      </MotionTableRow>
                    );
                  })}
                </MotionStagger>
              </table>
            </div>
          </SectionShell>
        </MotionReveal>
      );

    case "highlight":
      return (
        <MotionReveal key={`highlight-${navIndex}`} variants={scaleIn}>
          <SectionShell id={sectionAnchor(navIndex)} variant="highlight">
            <SectionTitle>
              <RichText text={section.title} />
            </SectionTitle>
            <MotionStagger as="ul" className="grid gap-2 sm:grid-cols-2" staggerChildren={0.08}>
              {section.items.map((item, i) => (
                <MotionLi
                  key={i}
                  variants={fadeUp}
                  className="flex items-start gap-2 rounded-lg bg-[var(--panel-strong)]/60 px-3 py-2 text-sm font-medium transition-transform duration-300 hover:translate-x-1"
                >
                  <span className="proposal-doc-pulse-dot mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-primary)]" />
                  <RichText text={item} />
                </MotionLi>
              ))}
            </MotionStagger>
          </SectionShell>
        </MotionReveal>
      );

    case "grid":
      return (
        <MotionReveal key={`grid-${navIndex}`}>
          <SectionShell id={sectionAnchor(navIndex)}>
            <SectionTitle>
              <RichText text={section.title} />
            </SectionTitle>
            <MotionStagger className="grid gap-4 sm:grid-cols-2" staggerChildren={0.1}>
              {section.cards.map((card, i) => (
                <MotionHoverCard
                  key={i}
                  className="rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-5 shadow-sm"
                >
                  <h4 className="mb-2 font-bold text-[var(--brand-primary)]">
                    <RichText text={card.title} />
                  </h4>
                  <p className="text-sm leading-relaxed text-[var(--muted)]">
                    <RichText text={card.body} />
                  </p>
                </MotionHoverCard>
              ))}
            </MotionStagger>
          </SectionShell>
        </MotionReveal>
      );

    default:
      return null;
  }
}

export function ProposalDocumentView({ document, style, budget }: Props) {
  const styleId = (style || "moderno") as ProposalStyleId;
  const reduce = useReducedMotion();
  let navIndex = 0;

  const blocks = document.sections.map((section) => {
    if (section.type !== "hero" && section.type !== "kpis") {
      navIndex += 1;
      return renderSection(section, navIndex);
    }
    return renderSection(section, 0);
  });

  if (reduce) {
    return (
      <div
        className={`proposal-doc proposal-doc--${styleId} flex flex-col gap-6 sm:gap-8`}
        data-budget={budget}
      >
        {blocks}
      </div>
    );
  }

  return (
    <motion.div
      className={`proposal-doc proposal-doc--${styleId} flex flex-col gap-6 sm:gap-8`}
      data-budget={budget}
      initial="hidden"
      animate="visible"
      variants={stagger(0.14, 0.05)}
    >
      {blocks.map((block, i) => (
        <motion.div key={i} variants={fadeUp}>
          {block}
        </motion.div>
      ))}
    </motion.div>
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
  const reduce = useReducedMotion();
  if (sections.length < 3) return null;

  const linkClass =
    "proposal-doc-index-link block rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300 hover:translate-x-1";

  const links = sections.map((section) => (
    <li key={section.id}>
      <a href={`#${section.id}`} className={linkClass}>
        {section.title}
      </a>
    </li>
  ));

  if (reduce) {
    return (
      <nav
        className="proposal-index no-print mb-8 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-5"
        aria-label={indexTitle}
      >
        <p className="proposal-index-title mb-3 text-xs font-black uppercase tracking-widest text-[var(--muted)]">
          {indexTitle}
        </p>
        <ol className="grid gap-1 sm:grid-cols-2">{links}</ol>
      </nav>
    );
  }

  return (
    <MotionReveal as="nav" className="proposal-index no-print mb-8 rounded-2xl border border-[var(--line)] bg-[var(--panel-strong)] p-5" variants={fadeIn}>
      <p className="proposal-index-title mb-3 text-xs font-black uppercase tracking-widest text-[var(--muted)]">
        {indexTitle}
      </p>
      <MotionStagger as="ol" className="grid gap-1 sm:grid-cols-2" staggerChildren={0.05}>
        {sections.map((section) => (
          <MotionLi key={section.id} variants={fadeIn}>
            <a href={`#${section.id}`} className={linkClass}>
              {section.title}
            </a>
          </MotionLi>
        ))}
      </MotionStagger>
    </MotionReveal>
  );
}

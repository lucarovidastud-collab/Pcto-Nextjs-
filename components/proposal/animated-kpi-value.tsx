"use client";

import { RichText } from "@/components/proposal/rich-text";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

function parseNumericKpi(text: string) {
  const trimmed = text.trim();
  const numMatch = trimmed.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/);
  if (!numMatch) return null;

  const numStr = numMatch[1];
  const idx = numMatch.index ?? 0;
  const prefix = trimmed.slice(0, idx);
  const suffix = trimmed.slice(idx + numStr.length);
  const normalized = numStr.replace(/\./g, "").replace(",", ".");
  const number = Number(normalized);
  if (!Number.isFinite(number)) return null;

  return {
    prefix,
    number,
    suffix,
    hasDecimals: numStr.includes(",")
  };
}

function formatItalianNumber(value: number, hasDecimals: boolean) {
  if (hasDecimals) {
    return value.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return Math.round(value).toLocaleString("it-IT");
}

export function AnimatedKpiValue({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduce = useReducedMotion();
  const parsed = useMemo(() => parseNumericKpi(text), [text]);
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    const current = parseNumericKpi(text);
    if (!current) {
      setDisplay(null);
      return;
    }

    const finalLabel = formatItalianNumber(current.number, current.hasDecimals);

    if (!inView || reduce) {
      setDisplay(finalLabel);
      return;
    }

    setDisplay(formatItalianNumber(0, current.hasDecimals));
    const controls = animate(0, current.number, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(formatItalianNumber(v, current.hasDecimals))
    });

    return () => controls.stop();
  }, [inView, reduce, text]);

  if (!parsed) {
    return <RichText text={text} />;
  }

  return (
    <span ref={ref} className="tabular-nums">
      {parsed.prefix}
      {display ?? formatItalianNumber(parsed.number, parsed.hasDecimals)}
      {parsed.suffix}
    </span>
  );
}

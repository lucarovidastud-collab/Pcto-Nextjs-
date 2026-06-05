"use client";

import { RichText } from "@/components/proposal/rich-text";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

function parseNumericKpi(text: string) {
  const trimmed = text.trim();
  const match = trimmed.match(/^([^\d]*?)([\d.,]+)([^\d]*)$/);
  if (!match) return null;

  const prefix = match[1] || "";
  const raw = match[2].replace(/\./g, "").replace(",", ".");
  const suffix = match[3] || "";
  const number = Number(raw);
  if (!Number.isFinite(number)) return null;

  const hasDecimals = match[2].includes(",");
  return { prefix, number, suffix, hasDecimals };
}

function formatItalianNumber(value: number, hasDecimals: boolean) {
  if (hasDecimals) {
    return value.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return Math.round(value).toLocaleString("it-IT");
}

export function AnimatedKpiValue({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const parsed = parseNumericKpi(text);
  const [display, setDisplay] = useState(parsed ? "0" : text);

  useEffect(() => {
    if (!parsed || !inView || reduce) {
      if (parsed && inView) {
        setDisplay(formatItalianNumber(parsed.number, parsed.hasDecimals));
      }
      return;
    }

    const controls = animate(0, parsed.number, {
      duration: 1.35,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(formatItalianNumber(v, parsed.hasDecimals))
    });

    return () => controls.stop();
  }, [inView, parsed, reduce]);

  if (!parsed || reduce) {
    return <RichText text={text} />;
  }

  return (
    <span ref={ref}>
      {parsed.prefix}
      {display}
      {parsed.suffix}
    </span>
  );
}

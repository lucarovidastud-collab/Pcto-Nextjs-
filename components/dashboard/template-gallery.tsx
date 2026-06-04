"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { BookTemplate, Wand2 } from "lucide-react";

export type TemplateSummary = {
  id: string;
  company: string;
  sector: string;
  website: string;
  budget: number;
  palette: string[];
  style: string;
  templateName: string;
};

type Props = {
  onUse: (template: TemplateSummary) => void;
};

export function TemplateGallery({ onUse }: Props) {
  const t = useTranslations("dashboard");
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/proposals/templates")
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { templates?: TemplateSummary[] };
        if (active) setTemplates(data.templates ?? []);
      })
      .catch(() => {
        // template non disponibili: la sezione resta nascosta
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  if (!loaded || templates.length === 0) return null;

  return (
    <div className="glass w-full overflow-x-hidden rounded-2xl p-5 sm:p-6 grid gap-3">
      <div className="flex items-center gap-2 border-b border-[var(--line)] pb-3">
        <BookTemplate size={16} className="text-[var(--accent)]" />
        <h2 className="text-sm font-black uppercase tracking-wider">{t("templatesTitle")}</h2>
      </div>
      <p className="text-xs text-[var(--muted)]">{t("templatesSubtitle")}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-3"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{template.templateName || template.company}</p>
              {template.sector ? (
                <p className="truncate text-[11px] text-[var(--muted)]">{template.sector}</p>
              ) : null}
              <div className="mt-1.5 flex gap-1" aria-hidden>
                {(template.palette ?? []).slice(0, 5).map((color, index) => (
                  <span
                    key={`${template.id}-${index}`}
                    className="h-3 w-3 rounded-full border border-[var(--line)]"
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={() => onUse(template)}
              className="btn-secondary shrink-0 text-xs font-bold flex items-center gap-1.5"
            >
              <Wand2 size={13} />
              {t("useTemplate")}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

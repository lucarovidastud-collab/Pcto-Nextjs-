"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { usePathname as useNextPathname } from "next/navigation";
import { isLocaleAgnosticPath, LOCALE_COOKIE_NAME } from "@/lib/i18n/path";
import { localeLabels, locales, type AppLocale } from "@/i18n/routing";
import { Globe, ChevronDown, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  className?: string;
  compact?: boolean;
};

export function LocaleSwitcher({ className = "", compact = false }: Props) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const fullPathname = useNextPathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  function onChange(next: AppLocale) {
    setOpen(false);
    if (isLocaleAgnosticPath(fullPathname)) {
      document.cookie = `${LOCALE_COOKIE_NAME}=${next};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
      window.location.assign(fullPathname);
      return;
    }
    router.replace(pathname, { locale: next });
  }

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <div ref={ref} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex w-full items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-1.5 text-xs font-bold text-[var(--foreground)] transition-colors hover:bg-[var(--panel)]"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("language")}
      >
        <Globe size={14} className="text-[var(--muted)] shrink-0" aria-hidden />
        {!compact && (
          <span className="text-[var(--muted)] hidden sm:inline">{t("language")}</span>
        )}
        <span className="flex-1 text-left">{localeLabels[locale]}</span>
        <ChevronDown
          size={12}
          className={`text-[var(--muted)] transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("language")}
          className="absolute top-[calc(100%+6px)] left-0 z-50 min-w-[150px] rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] shadow-[var(--shadow-md)] py-1 overflow-hidden"
        >
          {locales.map((code) => {
            const active = code === locale;
            return (
              <li key={code} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => onChange(code)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--line)] ${
                    active
                      ? "text-[var(--accent)] font-bold"
                      : "text-[var(--foreground)]"
                  }`}
                >
                  {localeLabels[code]}
                  {active && <Check size={12} className="text-[var(--accent)] shrink-0" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

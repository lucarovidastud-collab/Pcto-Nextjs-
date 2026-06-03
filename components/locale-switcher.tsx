"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, locales, type AppLocale } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { Globe } from "lucide-react";

type Props = {
  className?: string;
  compact?: boolean;
};

export function LocaleSwitcher({ className = "", compact = false }: Props) {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();

  function onChange(next: string) {
    router.replace(pathname, { locale: next as AppLocale });
  }

  return (
    <label
      className={`inline-flex items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] px-3 py-1.5 text-xs font-bold text-[var(--foreground)] ${className}`}
    >
      <Globe size={14} className="text-[var(--muted)] shrink-0" aria-hidden />
      {!compact && <span className="text-[var(--muted)] hidden sm:inline">{t("language")}</span>}
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent font-bold outline-none cursor-pointer max-w-[7.5rem]"
        aria-label={t("language")}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </select>
    </label>
  );
}

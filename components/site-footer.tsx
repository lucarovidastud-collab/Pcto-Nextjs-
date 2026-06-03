"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");
  const nav = useTranslations("nav");

  return (
    <footer className="glass mb-4 rounded-lg px-4 py-4 text-sm text-[var(--muted)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>{t("tagline")}</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="font-bold hover:text-[var(--foreground)]">
            {nav("privacy")}
          </Link>
          <Link href="/terms" className="font-bold hover:text-[var(--foreground)]">
            {nav("terms")}
          </Link>
        </div>
      </div>
    </footer>
  );
}

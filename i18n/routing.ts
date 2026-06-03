import { defineRouting } from "next-intl/routing";

export const locales = ["it", "en", "de", "fr", "es", "pt", "nl"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale: "it",
  localePrefix: "as-needed",
  localeDetection: true
});

export const localeLabels: Record<AppLocale, string> = {
  it: "Italiano",
  en: "English",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  pt: "Português",
  nl: "Nederlands"
};

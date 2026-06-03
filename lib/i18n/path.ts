import { routing, type AppLocale } from "@/i18n/routing";

/** Pathname senza prefisso lingua (es. /en/dashboard → /dashboard). */
export function stripLocaleFromPathname(pathname: string): { locale: AppLocale; pathname: string } {
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];

  if (first && routing.locales.includes(first as AppLocale) && first !== routing.defaultLocale) {
    const rest = segments.slice(1).join("/");
    return { locale: first as AppLocale, pathname: rest ? `/${rest}` : "/" };
  }

  return { locale: routing.defaultLocale, pathname: pathname || "/" };
}

export function localizedPath(path: string, locale: AppLocale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (locale === routing.defaultLocale) return normalized;
  return `/${locale}${normalized === "/" ? "" : normalized}`;
}

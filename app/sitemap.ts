import type { MetadataRoute } from "next";

const locales = ["it", "en", "de", "fr", "es", "pt", "nl"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.APP_URL ?? "https://pcto-nextjs.vercel.app").replace(/\/$/, "");

  const staticPages = ["", "/privacy", "/terms", "/login"];

  const entries: MetadataRoute.Sitemap = [];

  for (const page of staticPages) {
    // Default locale (it) — no prefix
    entries.push({
      url: `${base}${page}`,
      lastModified: new Date(),
      changeFrequency: page === "" ? "weekly" : "monthly",
      priority: page === "" ? 1 : 0.5
    });

    // Other locales with prefix
    for (const locale of locales) {
      if (locale === "it") continue;
      entries.push({
        url: `${base}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 0.9 : 0.4
      });
    }
  }

  return entries;
}

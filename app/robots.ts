import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? "https://pcto-nextjs.vercel.app";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/admin/", "/workspace/", "/api/"]
      }
    ],
    sitemap: `${base}/sitemap.xml`
  };
}

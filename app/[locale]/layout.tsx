import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  const base = (process.env.APP_URL ?? "https://pcto-nextjs.vercel.app").replace(/\/$/, "");
  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    metadataBase: new URL(base),
    icons: { icon: "/favicon.ico" },
    openGraph: {
      title,
      description,
      url: base,
      siteName: "QuoteGen Engine",
      type: "website",
      locale
    },
    twitter: {
      card: "summary_large_image",
      title,
      description
    },
    alternates: {
      canonical: base,
      languages: {
        it: base,
        en: `${base}/en`,
        de: `${base}/de`,
        fr: `${base}/fr`,
        es: `${base}/es`,
        pt: `${base}/pt`,
        nl: `${base}/nl`
      }
    }
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}

import { getTranslations } from "next-intl/server";

export default async function PrivacyPage() {
  const t = await getTranslations("privacy");
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-[var(--foreground)]">
      <h1 className="text-3xl font-black">{t("title")}</h1>
      <p className="mt-4 text-[var(--muted)]">{t("p1")}</p>
      <p className="mt-3 text-[var(--muted)]">{t("p2")}</p>
    </main>
  );
}

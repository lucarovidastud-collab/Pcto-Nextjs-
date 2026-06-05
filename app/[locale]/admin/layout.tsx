import { getTranslations } from "next-intl/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("admin");

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur-md supports-[backdrop-filter]:bg-slate-950/90 sm:px-6 sm:py-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 font-bold text-white shadow-lg">
            Q
          </div>
          <span className="truncate text-sm font-bold tracking-tight sm:text-base">{t("backofficeTitle")}</span>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-7xl flex-1 px-4 py-5 sm:px-6 sm:py-6 md:p-12">
        {children}
      </main>
    </div>
  );
}

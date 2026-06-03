"use client";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { Building2, CreditCard, History, LayoutDashboard, LogOut, Moon, Sun, Menu, X, Sparkles, User } from "lucide-react";
import { applyTheme, readStoredTheme, type ThemeMode } from "@/lib/theme";
import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations("dashboard");
  const pathname = usePathname();
  const router = useRouter();
  const links = useMemo(
    () => [
      { href: "/dashboard" as const, label: t("navWorkspace"), icon: LayoutDashboard },
      { href: "/dashboard/history" as const, label: t("navHistory"), icon: History },
      { href: "/dashboard/billing" as const, label: t("navBilling"), icon: CreditCard }
    ],
    [t]
  );
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [email, setEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = readStoredTheme();
    setTheme(stored);
    applyTheme(stored);
  }, []);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/auth/me");
      const payload = (await response.json()) as { authenticated?: boolean; user?: { email: string } };
      if (!payload.authenticated) {
        router.replace("/login");
        return;
      }
      setEmail(payload.user?.email || "");
    })();
  }, [router]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <div className="min-h-screen text-[var(--foreground)] bg-[var(--background)] flex flex-col lg:flex-row">
      
      {/* Mobile Sticky Header */}
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-6 py-4 lg:hidden border-b border-[var(--line)] bg-[color-mix(in_srgb,var(--background)_80%,transparent)]">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shadow-sm">
            <Sparkles size={14} />
          </span>
          <span className="text-sm font-black tracking-tight">QuoteGen</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] text-[var(--foreground)]"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={t("themeToggle")}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] text-[var(--foreground)] transition-all hover:bg-[var(--panel)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={t("toggleMenu")}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          role="button"
          tabIndex={0}
          aria-label={t("closeMenu")}
          onClick={() => setMobileMenuOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape" || e.key === "Enter" || e.key === " ") setMobileMenuOpen(false);
          }}
        >
          <aside
            className="glass absolute top-0 right-0 h-full w-[280px] p-6 flex flex-col gap-6 shadow-2xl animate-in slide-in-from-right duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white">
                  <Sparkles size={14} />
                </span>
                <span className="font-black text-sm">{t("panelTitle")}</span>
              </div>
              <button
                type="button"
                className="p-1 rounded-lg border border-[var(--line)] text-[var(--foreground)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            <nav className="grid gap-2">
              {links.map((link) => {
                const Icon = link.icon;
                const active = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`nav-link ${active ? "active text-white" : ""}`}
                  >
                    <Icon size={16} />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-xs text-[var(--muted)] flex items-center gap-2.5 mt-auto">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--line)] text-[var(--foreground)]">
                <User size={14} />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-[var(--foreground)] truncate">{t("operator")}</p>
                <p className="text-[10px] break-all truncate">{email || "..."}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <LocaleSwitcher className="w-full justify-between" />
              <button
                className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2 min-h-[2.5rem]"
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setMobileMenuOpen(false);
                }}
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                {t("themeLabel")} {theme === "dark" ? t("themeLight") : t("themeDark")}
              </button>
              <button
                className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2 min-h-[2.5rem] border-red-500/20 text-red-500 hover:bg-red-500/5"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                <LogOut size={14} />
                {t("logout")}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className="glass hidden lg:flex w-[260px] h-screen sticky top-0 flex-col gap-6 p-5 border-r border-[var(--line)] shrink-0 bg-[color-mix(in_srgb,var(--panel)_60%,transparent)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] text-white shadow-md">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">QuoteGen Engine</p>
            <p className="text-sm font-black tracking-tight">{t("consoleTitle")}</p>
          </div>
        </div>

        <div className="mt-2">
          <LocaleSwitcher className="w-full justify-between" />
        </div>

        <nav className="grid gap-1.5 mt-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active ? "active text-white" : ""}`}
              >
                <Icon size={16} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="mt-auto rounded-xl border border-[var(--line)] bg-[var(--panel-strong)] p-3 text-xs text-[var(--muted)] flex items-center gap-2.5 shadow-sm">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--line)] text-[var(--foreground)]">
            <User size={14} />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-[var(--foreground)] truncate">{t("operator")}</p>
            <p className="text-[10px] break-all truncate">{email || "..."}</p>
          </div>
        </div>

        {/* Quick controls */}
        <div className="grid gap-2">
          <button
            className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2 min-h-[2.5rem]"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            {t("themeLabel")} {theme === "dark" ? t("themeLight") : t("themeDark")}
          </button>
          <button
            className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2 min-h-[2.5rem] border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/30"
            onClick={logout}
          >
            <LogOut size={14} />
            {t("logout")}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-3 py-5 sm:px-4 sm:py-6 md:p-8 lg:p-10">
        {children}
      </main>
    </div>
  );
}

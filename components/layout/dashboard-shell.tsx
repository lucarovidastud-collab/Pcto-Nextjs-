"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, CreditCard, LayoutDashboard, LogOut, Moon, Sun, Menu, X, Sparkles, User } from "lucide-react";
import { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Workspace", icon: LayoutDashboard },
  { href: "/dashboard/billing", label: "Piani e pagamenti", icon: CreditCard }
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem("quotegen_theme");
    return stored === "dark" ? "dark" : "light";
  });
  const [email, setEmail] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("quotegen_theme", theme);
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
            title="Cambia tema"
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--line)] bg-[var(--panel-strong)] text-[var(--foreground)] transition-all hover:bg-[var(--panel)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
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
          aria-label="Chiudi menu"
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
                <span className="font-black text-sm">QuoteGen Panel</span>
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
                <p className="font-bold text-[var(--foreground)] truncate">Operatore</p>
                <p className="text-[10px] break-all truncate">{email || "..."}</p>
              </div>
            </div>

            <div className="grid gap-2">
              <button
                className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2 min-h-[2.5rem]"
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setMobileMenuOpen(false);
                }}
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                Tema {theme === "dark" ? "Chiaro" : "Scuro"}
              </button>
              <button
                className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2 min-h-[2.5rem] border-red-500/20 text-red-500 hover:bg-red-500/5"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                <LogOut size={14} />
                Disconnetti
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
            <p className="text-sm font-black tracking-tight">Console SaaS</p>
          </div>
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
            <p className="font-extrabold text-[var(--foreground)] truncate">Operatore</p>
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
            Tema {theme === "dark" ? "Chiaro" : "Scuro"}
          </button>
          <button
            className="btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2 min-h-[2.5rem] border-red-500/20 text-red-500 hover:bg-red-500/5 hover:border-red-500/30"
            onClick={logout}
          >
            <LogOut size={14} />
            Disconnetti
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 px-4 py-6 md:p-8 lg:p-10">
        {children}
      </main>
    </div>
  );
}

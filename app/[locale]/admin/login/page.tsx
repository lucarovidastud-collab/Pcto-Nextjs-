"use client";

import { useState } from "react";
import { Lock, Mail, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export default function AdminLoginPage() {
  const t = useTranslations("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error(t("invalidCredentials"));

      window.location.assign("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-20">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-2xl font-black mb-1">{t("restrictedAccess")}</h1>
        <p className="text-sm text-slate-400 mb-6">{t("managementArea")}</p>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="grid gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
            {t("adminEmail")}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="email"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="master@quotegen.it"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </label>

          <label className="grid gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wide">
            {t("securePassword")}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input
                type="password"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </label>

          {error && (
            <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {loading ? t("verifying") : t("enterBackoffice")}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>
      </div>
    </div>
  );
}

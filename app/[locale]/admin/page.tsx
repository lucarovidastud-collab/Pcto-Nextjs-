"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Users, Crown, Zap, ShieldCheck } from "lucide-react";

type TenantData = {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  plan: string;
  status: string;
  proposalsCount: number;
  createdAt: string;
};

export default function AdminDashboardPage() {
  const t = useTranslations("admin");
  const locale = useLocale();
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchTenants();
  }, []);

  async function fetchTenants() {
    try {
      const res = await fetch("/api/admin/tenants");
      if (res.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      if (!res.ok) throw new Error(t("loadError"));
      const json = await res.json();
      setTenants(json.tenants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function updatePlan(tenantId: string, newPlan: string, newStatus: string) {
    if (!confirm(t("confirmChangePlan", { plan: newPlan.toUpperCase() }))) return;

    setActionLoading(tenantId);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan, status: newStatus })
      });
      if (!res.ok) throw new Error(t("updateFailed"));

      setTenants(prev => prev.map(tenant =>
        tenant.id === tenantId ? { ...tenant, plan: newPlan, status: newStatus } : tenant
      ));
    } catch (err) {
      alert(err instanceof Error ? err.message : t("error"));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return (
    <div className="animate-pulse flex gap-2">
      <div className="h-4 w-4 bg-indigo-500 rounded-full animate-bounce" />
      {t("loading")}
    </div>
  );
  if (error) return <div className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</div>;

  const totalPro = tenants.filter(tenant => tenant.plan !== "none").length;

  return (
    <div className="grid gap-6">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Users size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{t("totalClients")}</span>
          </div>
          <div className="text-3xl font-black">{tenants.length}</div>
        </div>
        <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <Crown size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{t("subscribedClients")}</span>
          </div>
          <div className="text-3xl font-black text-indigo-400">{totalPro}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-slate-400 mb-2">
            <Zap size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{t("proposalsCreated")}</span>
          </div>
          <div className="text-3xl font-black">
            {tenants.reduce((acc, tenant) => acc + tenant.proposalsCount, 0)}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={18} />
            {t("workspaceManagement")}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-950/50 text-xs text-slate-400 uppercase font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">{t("colWorkspace")}</th>
                <th className="px-6 py-4">{t("colJoinDate")}</th>
                <th className="px-6 py-4 text-center">{t("colProposals")}</th>
                <th className="px-6 py-4">{t("colPlan")}</th>
                <th className="px-6 py-4 text-right">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200">{tenant.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{tenant.ownerEmail}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(tenant.createdAt).toLocaleDateString(locale)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] h-6 bg-slate-800 rounded-full text-xs font-bold">
                      {tenant.proposalsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {tenant.plan !== "none" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
                        <Crown size={12} />
                        {tenant.plan.toUpperCase()}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                        {t("noPlan")}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        disabled={actionLoading === tenant.id}
                        onClick={() => updatePlan(tenant.id, "starter", "active")}
                        className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-50"
                      >
                        {t("givePro")}
                      </button>
                      <button
                        disabled={actionLoading === tenant.id}
                        onClick={() => updatePlan(tenant.id, "none", "canceled")}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-50"
                      >
                        {t("revoke")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    {t("noClients")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

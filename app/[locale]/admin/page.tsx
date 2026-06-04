"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Users, Crown, Zap, ShieldCheck, Gift } from "lucide-react";
import {
  adminAssignablePlans,
  planMonthlyLabel,
  statusForAdminPlan,
  type AdminAssignablePlan
} from "@/lib/admin/subscription-plans";

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
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [tenants, setTenants] = useState<TenantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [draftPlans, setDraftPlans] = useState<Record<string, AdminAssignablePlan>>({});

  useEffect(() => {
    void fetchTenants();
  }, []);

  useEffect(() => {
    setDraftPlans((prev) => {
      const next = { ...prev };
      for (const tenant of tenants) {
        const plan = adminAssignablePlans.includes(tenant.plan as AdminAssignablePlan)
          ? (tenant.plan as AdminAssignablePlan)
          : "none";
        if (!next[tenant.id]) next[tenant.id] = plan;
      }
      return next;
    });
  }, [tenants]);

  async function fetchTenants() {
    try {
      const res = await fetch("/api/admin/tenants");
      if (res.status === 401) {
        window.location.assign("/admin/login");
        return;
      }
      if (!res.ok) throw new Error(t("loadError"));
      const json = (await res.json()) as { tenants?: TenantData[] };
      setTenants(json.tenants || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
    }
  }

  function planLabel(plan: AdminAssignablePlan) {
    if (plan === "none") return t("noPlan");
    const price = planMonthlyLabel(plan);
    return price ? `${t(`plan_${plan}`)} (${price}${tCommon("perMonth")})` : t(`plan_${plan}`);
  }

  async function applyPlan(tenantId: string) {
    const newPlan = draftPlans[tenantId] ?? "none";
    const tenant = tenants.find((row) => row.id === tenantId);
    if (tenant && tenant.plan === newPlan && tenant.status === statusForAdminPlan(newPlan)) {
      return;
    }

    if (!confirm(t("confirmAssignPlan", { plan: planLabel(newPlan) }))) return;

    setActionLoading(tenantId);
    try {
      const res = await fetch(`/api/admin/tenants/${tenantId}/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: newPlan })
      });
      if (!res.ok) throw new Error(t("updateFailed"));

      const newStatus = statusForAdminPlan(newPlan);
      setTenants((prev) =>
        prev.map((row) =>
          row.id === tenantId ? { ...row, plan: newPlan, status: newStatus } : row
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : t("error"));
    } finally {
      setActionLoading(null);
    }
  }

  const totalPro = useMemo(
    () => tenants.filter((tenant) => tenant.plan !== "none" && tenant.status === "active").length,
    [tenants]
  );

  if (loading) {
    return (
      <div className="animate-pulse flex gap-2">
        <div className="h-4 w-4 bg-indigo-500 rounded-full animate-bounce" />
        {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 bg-red-400/10 p-4 rounded-xl border border-red-400/20">{error}</div>
    );
  }

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
        <div className="p-4 border-b border-slate-800 bg-slate-950/30 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={18} />
            {t("workspaceManagement")}
          </h2>
          <p className="text-xs text-slate-500 flex items-center gap-1.5">
            <Gift size={14} className="text-indigo-400 shrink-0" />
            {t("giftHint")}
          </p>
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
              {tenants.map((tenant) => {
                const draft = draftPlans[tenant.id] ?? "none";
                const isActiveGift =
                  tenant.plan !== "none" &&
                  (tenant.status === "active" || tenant.status === "trialing");

                return (
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
                      {isActiveGift ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-bold">
                          <Crown size={12} />
                          {adminAssignablePlans.includes(tenant.plan as AdminAssignablePlan)
                            ? t(`plan_${tenant.plan as AdminAssignablePlan}`)
                            : tenant.plan}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-xs font-bold">
                          {t("noPlan")}
                        </span>
                      )}
                      {tenant.status && tenant.plan !== "none" && (
                        <p className="text-[10px] text-slate-500 mt-1 uppercase">{tenant.status}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2 flex-wrap">
                        <label className="sr-only" htmlFor={`plan-${tenant.id}`}>
                          {t("selectPlan")}
                        </label>
                        <select
                          id={`plan-${tenant.id}`}
                          value={draft}
                          disabled={actionLoading === tenant.id}
                          onChange={(e) =>
                            setDraftPlans((prev) => ({
                              ...prev,
                              [tenant.id]: e.target.value as AdminAssignablePlan
                            }))
                          }
                          className="text-xs bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1.5 font-semibold min-w-[10rem]"
                        >
                          {adminAssignablePlans.map((plan) => (
                            <option key={plan} value={plan}>
                              {planLabel(plan)}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={actionLoading === tenant.id}
                          onClick={() => void applyPlan(tenant.id)}
                          className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg font-bold transition disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          <Gift size={12} />
                          {actionLoading === tenant.id ? t("saving") : t("applyGift")}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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

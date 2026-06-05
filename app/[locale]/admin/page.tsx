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

  function renderPlanBadge(tenant: TenantData) {
    const isActiveGift =
      tenant.plan !== "none" &&
      (tenant.status === "active" || tenant.status === "trialing");

    return (
      <div>
        {isActiveGift ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-2.5 py-1 text-xs font-bold text-indigo-400">
            <Crown size={12} />
            {adminAssignablePlans.includes(tenant.plan as AdminAssignablePlan)
              ? t(`plan_${tenant.plan as AdminAssignablePlan}`)
              : tenant.plan}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-400">
            {t("noPlan")}
          </span>
        )}
        {tenant.status && tenant.plan !== "none" ? (
          <p className="mt-1 text-[10px] uppercase text-slate-500">{tenant.status}</p>
        ) : null}
      </div>
    );
  }

  function renderPlanActions(tenant: TenantData, stacked = false) {
    const draft = draftPlans[tenant.id] ?? "none";

    return (
      <div className={stacked ? "grid w-full gap-2" : "flex flex-wrap items-center justify-end gap-2"}>
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
          className={`rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-2 text-xs font-semibold text-slate-200 ${
            stacked ? "w-full min-w-0" : "min-w-[10rem]"
          }`}
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
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50 ${
            stacked ? "w-full" : ""
          }`}
        >
          <Gift size={12} />
          {actionLoading === tenant.id ? t("saving") : t("applyGift")}
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex animate-pulse items-center gap-2 text-sm text-slate-400">
        <div className="h-4 w-4 animate-bounce rounded-full bg-indigo-500" />
        {t("loading")}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-400">{error}</div>
    );
  }

  return (
    <div className="grid w-full min-w-0 gap-5 sm:gap-6">
      <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-3 text-slate-400">
            <Users size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{t("totalClients")}</span>
          </div>
          <div className="text-3xl font-black">{tenants.length}</div>
        </div>
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-900/20 p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-3 text-indigo-400">
            <Crown size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{t("subscribedClients")}</span>
          </div>
          <div className="text-3xl font-black text-indigo-400">{totalPro}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
          <div className="mb-2 flex items-center gap-3 text-slate-400">
            <Zap size={18} />
            <span className="text-xs font-bold uppercase tracking-wider">{t("proposalsCreated")}</span>
          </div>
          <div className="text-3xl font-black">
            {tenants.reduce((acc, tenant) => acc + tenant.proposalsCount, 0)}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-xl">
        <div className="flex flex-col gap-2 border-b border-slate-800 bg-slate-950/30 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 font-bold">
            <ShieldCheck className="text-emerald-500" size={18} />
            {t("workspaceManagement")}
          </h2>
          <p className="flex items-start gap-1.5 text-xs leading-relaxed text-slate-500 sm:items-center">
            <Gift size={14} className="mt-0.5 shrink-0 text-indigo-400 sm:mt-0" />
            <span>{t("giftHint")}</span>
          </p>
        </div>

        {/* Mobile: card per workspace */}
        <div className="divide-y divide-slate-800/50 md:hidden">
          {tenants.map((tenant) => (
            <article key={tenant.id} className="grid gap-3 p-4">
              <div className="min-w-0">
                <div className="break-words font-bold text-slate-200">{tenant.name}</div>
                <div className="mt-1 break-all text-xs text-slate-500">{tenant.ownerEmail}</div>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-400">
                <span>
                  <span className="font-bold text-slate-500">{t("colJoinDate")}: </span>
                  {new Date(tenant.createdAt).toLocaleDateString(locale)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="font-bold text-slate-500">{t("colProposals")}: </span>
                  <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-200">
                    {tenant.proposalsCount}
                  </span>
                </span>
              </div>

              <div>
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t("colPlan")}
                </p>
                {renderPlanBadge(tenant)}
              </div>

              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {t("colActions")}
                </p>
                {renderPlanActions(tenant, true)}
              </div>
            </article>
          ))}
          {tenants.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-slate-500">{t("noClients")}</p>
          ) : null}
        </div>

        {/* Desktop: tabella */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-950/50 text-xs font-bold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">{t("colWorkspace")}</th>
                <th className="px-6 py-4">{t("colJoinDate")}</th>
                <th className="px-6 py-4 text-center">{t("colProposals")}</th>
                <th className="px-6 py-4">{t("colPlan")}</th>
                <th className="px-6 py-4 text-right">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="transition-colors hover:bg-slate-800/20">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-200">{tenant.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{tenant.ownerEmail}</div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-slate-400">
                    {new Date(tenant.createdAt).toLocaleDateString(locale)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex h-6 min-w-[2rem] items-center justify-center rounded-full bg-slate-800 text-xs font-bold">
                      {tenant.proposalsCount}
                    </span>
                  </td>
                  <td className="px-6 py-4">{renderPlanBadge(tenant)}</td>
                  <td className="px-6 py-4 text-right">{renderPlanActions(tenant)}</td>
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

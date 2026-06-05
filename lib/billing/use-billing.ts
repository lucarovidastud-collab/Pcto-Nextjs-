import { useCallback, useEffect, useState } from "react";

/** Stato abbonamento/uso del workspace, isolato dalla dashboard. */
export function useBilling() {
  const [planName, setPlanName] = useState("none");
  const [proposalsUsed, setProposalsUsed] = useState(0);
  const [proposalLimit, setProposalLimit] = useState<number | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const refreshBilling = useCallback(async () => {
    const response = await fetch("/api/billing/checkout");
    if (!response.ok) return;
    const payload = (await response.json()) as {
      current: { plan: string };
      limits: { proposalLimit: number } | null;
      usage: { proposalsThisMonth: number };
      hasActiveSubscription: boolean;
    };
    setPlanName(payload.current.plan);
    setProposalsUsed(payload.usage.proposalsThisMonth);
    setProposalLimit(payload.limits?.proposalLimit ?? null);
    setHasActiveSubscription(payload.hasActiveSubscription);
  }, []);

  useEffect(() => {
    void refreshBilling();
  }, [refreshBilling]);

  return { planName, proposalsUsed, proposalLimit, hasActiveSubscription, refreshBilling };
}

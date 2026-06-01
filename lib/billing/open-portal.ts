export async function openStripeBillingPortal(): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch("/api/billing/portal", { method: "POST" });
  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !payload.url) {
    return { ok: false, error: payload.error || "Portale Stripe non disponibile." };
  }
  window.location.assign(payload.url);
  return { ok: true };
}

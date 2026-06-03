export async function openStripeBillingPortal(
  fallbackError = "Portal unavailable."
): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch("/api/billing/portal", { method: "POST" });
  const payload = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !payload.url) {
    return { ok: false, error: payload.error || fallbackError };
  }
  window.location.assign(payload.url);
  return { ok: true };
}

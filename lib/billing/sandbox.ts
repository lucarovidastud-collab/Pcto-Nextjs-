/** Sandbox billing solo in sviluppo locale, mai in production Vercel. */
export function isBillingSandboxEnabled() {
  return process.env.NODE_ENV === "development" && process.env.BILLING_ALLOW_SANDBOX === "1";
}

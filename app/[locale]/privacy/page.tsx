export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-[var(--foreground)]">
      <h1 className="text-3xl font-black">Privacy Policy</h1>
      <p className="mt-4 text-[var(--muted)]">
        QuoteGen tratta dati account, workspace e contenuti proposta per erogare il servizio SaaS.
        Gli utenti possono richiedere accesso, rettifica, cancellazione e portabilita dei dati.
      </p>
      <p className="mt-3 text-[var(--muted)]">
        I provider di autenticazione (Google, GitHub, Microsoft, ecc.) sono gestiti tramite Firebase Authentication.
      </p>
    </main>
  );
}

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 text-[var(--foreground)]">
      <h1 className="text-3xl font-black">Termini di Servizio</h1>
      <p className="mt-4 text-[var(--muted)]">
        L&apos;utilizzo di QuoteGen e soggetto al rispetto delle condizioni contrattuali, dei limiti del piano
        sottoscritto e delle normative applicabili.
      </p>
      <p className="mt-3 text-[var(--muted)]">
        I pagamenti ricorrenti sono gestiti da Stripe. In caso di mancato pagamento possono essere applicate limitazioni al servizio.
      </p>
    </main>
  );
}

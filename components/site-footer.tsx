import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="glass mb-4 rounded-lg px-4 py-4 text-sm text-[var(--muted)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>QuoteGen Engine · SaaS Enterprise</p>
        <div className="flex gap-4">
          <Link href="/privacy" className="font-bold hover:text-[var(--foreground)]">
            Privacy
          </Link>
          <Link href="/terms" className="font-bold hover:text-[var(--foreground)]">
            Termini
          </Link>
        </div>
      </div>
    </footer>
  );
}

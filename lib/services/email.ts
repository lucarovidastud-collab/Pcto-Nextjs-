import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

export async function sendProposalSignedEmail(opts: {
  to: string;
  company: string;
  signedBy: string;
  signedAt: string;
  shareLink: string;
  budget: number;
}) {
  const resend = getResend();
  if (!resend) return; // Email not configured — silent skip

  const fromDomain = process.env.RESEND_FROM_DOMAIN || "onboarding@resend.dev";

  await resend.emails.send({
    from: `QuoteGen Engine <${fromDomain}>`,
    to: opts.to,
    subject: `✅ Preventivo firmato — ${opts.company}`,
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:auto;padding:32px;">
        <h2 style="color:#0d9488;margin-bottom:8px;">Preventivo firmato!</h2>
        <p style="color:#334155;font-size:15px;line-height:1.6;">
          Il preventivo per <strong>${opts.company}</strong> è stato accettato e firmato digitalmente.
        </p>
        <table style="background:#f8fafc;border-radius:12px;padding:20px;width:100%;margin:20px 0;">
          <tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Firmato da</td><td style="font-weight:bold;font-size:14px;">${opts.signedBy}</td></tr>
          <tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Data</td><td style="font-weight:bold;font-size:14px;">${new Date(opts.signedAt).toLocaleString("it-IT")}</td></tr>
          <tr><td style="color:#64748b;font-size:13px;padding:4px 0;">Budget</td><td style="font-weight:bold;font-size:14px;color:#0d9488;">€ ${Number(opts.budget).toLocaleString("it-IT")}</td></tr>
        </table>
        <a href="${opts.shareLink}" style="display:inline-block;background:#0d9488;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;">
          Visualizza proposta firmata
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px;">QuoteGen Engine — SaaS Enterprise</p>
      </div>
    `
  });
}

export async function sendProposalExpiryReminderEmail(opts: {
  to: string;
  company: string;
  expiresAt: string;
  shareLink: string;
  daysLeft: number;
}) {
  const resend = getResend();
  if (!resend) return;

  const fromDomain = process.env.RESEND_FROM_DOMAIN || "onboarding@resend.dev";

  await resend.emails.send({
    from: `QuoteGen Engine <${fromDomain}>`,
    to: opts.to,
    subject: `⏰ Preventivo in scadenza — ${opts.company} (${opts.daysLeft} ${opts.daysLeft === 1 ? "giorno" : "giorni"})`,
    html: `
      <div style="font-family:sans-serif;max-width:540px;margin:auto;padding:32px;">
        <h2 style="color:#f59e0b;margin-bottom:8px;">Preventivo in scadenza</h2>
        <p style="color:#334155;font-size:15px;line-height:1.6;">
          Il preventivo per <strong>${opts.company}</strong> scade tra <strong>${opts.daysLeft} ${opts.daysLeft === 1 ? "giorno" : "giorni"}</strong>
          (${new Date(opts.expiresAt).toLocaleDateString("it-IT")}).
        </p>
        <p style="color:#64748b;font-size:14px;">Se il cliente non ha ancora firmato, condividi di nuovo il link.</p>
        <a href="${opts.shareLink}" style="display:inline-block;background:#f59e0b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;margin-top:12px;">
          Visualizza preventivo
        </a>
        <p style="color:#94a3b8;font-size:12px;margin-top:32px;">QuoteGen Engine — SaaS Enterprise</p>
      </div>
    `
  });
}

# QuoteGen Enterprise SaaS

Piattaforma SaaS multi-tenant per generazione e gestione di proposte commerciali digitali.

## Stack attivo
- Next.js 15 + React 19 (App Router)
- Firebase Auth (Google, GitHub) + Firestore
- JWT session (`jose`) cookie HttpOnly
- Stripe Checkout + Customer Portal + webhook
- OpenRouter (AI proposte, budget, palette brand)
- Sentry + Vitest + Playwright

## Quick start
1. Copia `.env.example` → `.env`
2. Configura Firebase: `docs/firebase-setup.md`
3. Configura Stripe: `docs/stripe-setup.md`
4. `npm install` && `npm run dev`
5. Apri `http://localhost:3000/login`

## Route principali
| Route | Descrizione |
|-------|-------------|
| `/` | Landing |
| `/login` | OAuth Google/GitHub |
| `/dashboard` | Crea proposte |
| `/dashboard/billing` | Piani Stripe |
| `/p/[token]` | Pagina cliente + firma |

## API
- `GET /api/health`
- `POST /api/auth/firebase` — login OAuth
- `GET /api/auth/me` · `POST /api/auth/logout`
- `POST /api/analyze-site` — palette + budget AI
- `GET|POST /api/proposals`
- `GET /api/billing/checkout` · `POST` checkout
- `POST /api/billing/portal`
- `GET /api/billing/status` — diagnostica (owner/admin)
- `POST /api/billing/webhook`

> `POST /api/auth/login` (password) è disabilitato (410).

## Quality gates
```bash
npm run typecheck
npm run test
npm run build
npm run smoke
node scripts/stripe-diagnose.mjs
```

## Deploy Vercel
```bash
npm run vercel:env:sync
npx vercel deploy --prod
```

## Documentazione
- `docs/firebase-setup.md`
- `docs/stripe-setup.md`
- `docs/setup-local.md`
- `docs/staging-checklist.md`

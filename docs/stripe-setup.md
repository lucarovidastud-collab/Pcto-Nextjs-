# Stripe setup (QuoteGen)

## Variabili richieste

| Variabile | Obbligatoria | Note |
|-----------|--------------|------|
| `STRIPE_SECRET_KEY` | Sì | `sk_live_...` o `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Sì | `whsec_...` dalla destinazione webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Consigliata | `pk_live_...` / `pk_test_...` |
| `APP_URL` | Sì | Es. `https://pcto-versionecodex.vercel.app` |
| `STRIPE_PRICE_STARTER` | No | Se assente, l'app crea/recupera prezzi con `lookup_key` |
| `STRIPE_PRICE_GROWTH` | No | Idem |
| `STRIPE_PRICE_ENTERPRISE` | No | Idem |

## Webhook

URL production:

`https://pcto-versionecodex.vercel.app/api/billing/webhook`

Eventi consigliati:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Importante:** webhook e `STRIPE_SECRET_KEY` devono essere nella stessa modalità (Live con Live, Test con Test).

## Customer Portal

L'app tenta di creare automaticamente una configurazione portal se manca.

Puoi verificarla in Stripe Dashboard → **Settings → Billing → Customer portal**.

## Diagnostica locale

```bash
node scripts/stripe-diagnose.mjs
```

## Sync env su Vercel

```bash
npm run vercel:env:sync
```

Poi rideploy production.

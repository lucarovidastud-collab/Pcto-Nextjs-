# Stripe setup (QuoteGen)

## Variabili richieste

| Variabile | Obbligatoria | Note |
|-----------|--------------|------|
| `STRIPE_SECRET_KEY` | Sì | `sk_live_...` o `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Sì | `whsec_...` dalla destinazione webhook |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Consigliata | `pk_live_...` / `pk_test_...` |
| `APP_URL` | Sì | Dominio **unico** usato dagli utenti (es. `https://pcto-nextjs.vercel.app`). Se hai due deploy Vercel, imposta lo stesso valore su entrambi: il vecchio hostname verrà reindirizzato qui. |
| `STRIPE_PRICE_STARTER` | No | Se assente, l'app crea/recupera prezzi con `lookup_key` |
| `STRIPE_PRICE_GROWTH` | No | Idem |
| `STRIPE_PRICE_ENTERPRISE` | No | Idem |

## Webhook

URL production:

`https://TUO-DOMINIO.vercel.app/api/billing/webhook` (stesso host di `APP_URL`)

Eventi consigliati:

- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Importante:** webhook e `STRIPE_SECRET_KEY` devono essere nella stessa modalità (Live con Live, Test con Test).

## Customer Portal

L'app tenta di creare automaticamente una configurazione portal se manca.

Puoi verificarla in Stripe Dashboard → **Settings → Billing → Customer portal**.

## Checkout e sandbox

- In **dashboard → Piani e pagamenti**, il checkout usa **Stripe Embedded Checkout** (form pagamento dentro QuoteGen) se è impostata `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`; altrimenti redirect alla pagina Stripe classica.
- Colori, font, testi in italiano e icona **Q** sono inviati via API (`branding_settings`) e allineati al tema QuoteGen.
- `BILLING_ALLOW_SANDBOX` funziona **solo** con `npm run dev` (mai su Vercel production).
- Gli ID prezzo in `.env` devono essere `price_...` (consigliato) o `prod_...` coerenti con i piani €10 / €29 / €99.

## Branding pagina carta (Stripe)

1. **Automatico (codice):** ogni sessione checkout imposta `locale: it`, colori teal/carta, icona `/brand/stripe-icon.svg`, nomi prodotto leggibili.
2. **Dashboard Stripe (consigliato):** [Impostazioni → Branding → Checkout](https://dashboard.stripe.com/settings/branding/checkout) — puoi caricare un logo PNG quando lo avete; l’app userà quello come fallback se non passi `branding_settings`.
3. **Portale cliente** (fatture / metodo di pagamento): stesso branding da Dashboard → Billing → Customer portal.

## Diagnostica locale

```bash
npm run stripe:diagnose
node scripts/stripe-list-prices.mjs
```

## Sync env su Vercel

```bash
npm run vercel:env:sync
```

Poi rideploy production.

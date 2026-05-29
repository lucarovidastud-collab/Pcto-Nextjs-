# Checklist Staging (Pre-Go-Live)

## Configurazione
- [ ] Ambiente `staging` separato da `production`
- [ ] Secret gestiti via provider (no `.env` committato)
- [ ] `JWT_SECRET` unico e robusto per staging
- [ ] `APP_URL` corretto

## Sicurezza
- [ ] Security headers attivi (`middleware.ts`)
- [ ] Rate limit attivo su API
- [ ] Accessi admin limitati
- [ ] Rotazione chiavi API documentata

## Qualita'
- [ ] CI verde su branch di rilascio
- [ ] `typecheck`, `test`, `build` passati
- [ ] Smoke test passato (`npm run smoke`)

## Billing
- [ ] Stripe sandbox configurato
- [ ] Webhook endpoint raggiungibile
- [ ] Cambio piano testato (starter/growth/enterprise)

## Operazioni
- [ ] Piano backup/restore testato
- [ ] Runbook disponibile (`docs/runbook.md`)
- [ ] Healthcheck monitorato (`/api/health`)

# Runbook Operativo

## Health checks
- GET `/api/auth/me`
- GET `/api/billing/checkout` (con sessione valida)

## Incident response (base)
1. Identificare endpoint e tenant impattati
2. Ridurre blast radius (rate limit, revoke sessioni)
3. Analizzare log applicativi
4. Eseguire rollback o fix
5. Comunicare postmortem

## Backup e restore
- Backup: `npm run backup:db`
- Restore: `npm run restore:db -- data/backups/<file>.db`

## SLO iniziali
- Availability API: 99.5%
- Error rate server 5xx: <1%
- P95 latency API: <600ms

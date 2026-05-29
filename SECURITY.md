# Security Policy

## Supported versions
L'ultima versione su branch principale e' considerata supportata.

## Reporting vulnerabilities
Segnalare vulnerabilita' con:
- descrizione impatto
- step di riproduzione
- eventuale PoC

## Hardening baseline
- Session cookie HttpOnly + SameSite
- Rate limiting API
- Security headers via `middleware.ts`
- Validazione payload con Zod
- Audit trail da estendere per azioni critiche

## Secret management
- Nessun secret in repository
- Rotazione periodica API key
- Distinzione rigorosa tra chiavi dev/staging/prod

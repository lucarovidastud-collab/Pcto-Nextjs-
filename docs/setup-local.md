# Setup Locale Passo-Passo

## 1) Prerequisiti
- Node.js 20+ (consigliato 22)
- npm 10+

Verifica:
- `node -v`
- `npm -v`

## 2) Clona/apri progetto
- Apri la cartella `C:/PCTO-NEXTJS`

## 3) Configura variabili ambiente
1. Copia `.env.example` in `.env`
2. Imposta almeno:
   - `JWT_SECRET` (stringa lunga casuale)
   - `APP_URL=http://localhost:3000`
3. Per test locali puoi lasciare Stripe/Gemini in placeholder.

## 4) Installa dipendenze
- `npm install`

## 5) Avvia in sviluppo
- `npm run dev`
- Apri [http://localhost:3000](http://localhost:3000)

Credenziali demo seed:
- `admin@quotegen.local`
- `admin12345`

## 6) Verifica quality gates
- `npm run typecheck`
- `npm run test`
- `npm run build`

Tutti devono completare senza errori.

## 7) Smoke test end-to-end API
Con server dev attivo:
- `npm run smoke`

Output atteso:
- `[smoke] OK`

## 8) Backup e restore database
- Backup: `npm run backup:db`
- Restore: `npm run restore:db -- data/backups/<nome-file>.db`

## 9) Modalita' produzione locale
1. `npm run build`
2. `npm run start`
3. Verifica health: [http://localhost:3000/api/health](http://localhost:3000/api/health)

# Database layer (provider-agnostic)

QuoteGen separa **auth** (Firebase Auth, lato client) dal **database applicativo** (tenant, proposte, abbonamenti).

## Architettura

```
API routes / services
        ↓
@/lib/db/repositories   ← unica import consentita per i dati
        ↓
getRepository()          ← factory (env DATABASE_PROVIDER)
        ↓
   ┌────┴────┐
firestore   mongodb (stub / futuro)
```

- **Tipi dominio:** `lib/db/types.ts`
- **Contratto:** `lib/db/repository.ts` (`DatabaseRepository`)
- **Implementazioni:** `lib/db/providers/firestore.ts`, `lib/db/providers/mongodb.ts`

## Configurazione

| Variabile | Valori | Default |
|-----------|--------|---------|
| `DATABASE_PROVIDER` | `firestore`, `mongodb` | `firestore` |
| `MONGODB_URI` | connection string | — (solo quando MongoDB sarà implementato) |

Esempio `.env`:

```env
DATABASE_PROVIDER=firestore
# MONGODB_URI=mongodb+srv://...
```

Per passare a MongoDB in futuro:

1. Implementare i metodi in `lib/db/providers/mongodb.ts` (stesse collezioni logiche: `users`, `tenants`, `memberships`, `subscriptions`, `proposals`).
2. Impostare `DATABASE_PROVIDER=mongodb` e `MONGODB_URI`.
3. **Non** modificare le API route: usano già `@/lib/db/repositories`.

## Firebase Auth vs Firestore

- **Firebase Auth** (`NEXT_PUBLIC_FIREBASE_*`, login OAuth/email) resta per l’autenticazione.
- **Firestore** è solo il provider dati attuale; può essere sostituito senza cambiare le pagine React.

## Regole per nuovo codice

- ✅ `import { createProposal } from "@/lib/db/repositories"`
- ❌ `import { getFirestoreDb } from "@/lib/firebase/admin"` nelle route API
- ❌ query Firestore sparse nel codice business

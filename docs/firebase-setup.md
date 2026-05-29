# Setup Firebase (Auth + Firestore)

## 1) Crea progetto Firebase
- Console Firebase -> Add project
- Abilita Authentication
- Abilita Firestore (modalita production)

## 2) Provider OAuth gratuiti
In Authentication -> Sign-in method abilita:
- Google
- GitHub (serve OAuth App GitHub)
- Microsoft
- Apple (opzionale)
- Twitter/X (opzionale)
- Facebook (opzionale)

## 3) App Web
Project settings -> Your apps -> Web app
Copia config in `.env`:
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## 4) Service Account (server)
Project settings -> Service accounts -> Generate new private key
Opzione A (consigliata):
- incolla JSON in `FIREBASE_SERVICE_ACCOUNT_JSON` (una riga)

Opzione B:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (con `\n` escaped)

## 5) Authorized domains (obbligatorio per login)
Authentication -> Settings -> Authorized domains

Aggiungi **tutti** questi domini:
- `localhost`
- `pcto-versionecodex.vercel.app`
- `quotegen-engine-2.firebaseapp.com` (auth handler Firebase)

Senza il dominio Vercel, Google reindirizza ma la sessione non si crea e resti su `/login`.

## 6) Firestore rules (base dev)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```
Le API server usano Admin SDK, quindi le regole client restano chiuse.

## 7) Deploy env su Vercel
Carica tutte le variabili Firebase + Stripe + JWT + OpenRouter in Production.

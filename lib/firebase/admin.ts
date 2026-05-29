import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function initFirebaseAdmin(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    return initializeApp({ credential: cert(JSON.parse(json)) });
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin non configurato: imposta FIREBASE_SERVICE_ACCOUNT_JSON oppure PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY");
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey })
  });
}

export function getAdminApp() {
  return initFirebaseAdmin();
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getFirestoreDb() {
  return getFirestore(getAdminApp());
}

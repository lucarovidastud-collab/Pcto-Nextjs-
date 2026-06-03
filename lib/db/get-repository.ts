import type { DatabaseRepository } from "@/lib/db/repository";
import { createFirestoreRepository } from "@/lib/db/providers/firestore";
import { createMongoRepository } from "@/lib/db/providers/mongodb";

export type DatabaseProvider = "firestore" | "mongodb";

export function getDatabaseProvider(): DatabaseProvider {
  const raw = process.env.DATABASE_PROVIDER?.trim().toLowerCase();
  if (raw === "mongodb" || raw === "mongo") return "mongodb";
  return "firestore";
}

function createRepository(provider: DatabaseProvider): DatabaseRepository {
  switch (provider) {
    case "mongodb":
      return createMongoRepository();
    case "firestore":
    default:
      return createFirestoreRepository();
  }
}

let cached: DatabaseRepository | null = null;
let cachedProvider: DatabaseProvider | null = null;

/** Singleton del repository attivo (scelto da DATABASE_PROVIDER). */
export function getRepository(): DatabaseRepository {
  const provider = getDatabaseProvider();
  if (!cached || cachedProvider !== provider) {
    cached = createRepository(provider);
    cachedProvider = provider;
  }
  return cached;
}

/** Solo per test: resetta la cache del singleton. */
export function resetRepositoryForTests() {
  cached = null;
  cachedProvider = null;
}

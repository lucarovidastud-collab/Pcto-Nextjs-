import { getFirestoreDb } from "@/lib/firebase/admin";
import type { DatabaseRepository } from "@/lib/db/repository";
import {
  defaultShareExpiry,
  makeId,
  type ProposalRecord,
  type ProposalStatus,
  type Role
} from "@/lib/db/types";

function stripUndefinedPatch<T extends Record<string, unknown>>(patch: T) {
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)) as Partial<T>;
}

export function createFirestoreRepository(): DatabaseRepository {
  return {
    async upsertUserFromFirebase(input) {
      const db = getFirestoreDb();
      const userRef = db.collection("users").doc(input.uid);
      const now = new Date().toISOString();
      const userDoc = await userRef.get();
      const userData: Record<string, string> = {
        email: input.email,
        displayName: input.displayName || "",
        photoURL: input.photoURL || "",
        updatedAt: now
      };
      if (!userDoc.exists) {
        userData.createdAt = now;
      }
      await userRef.set(userData, { merge: true });

      const memberships = await db.collection("memberships").where("userId", "==", input.uid).limit(1).get();
      if (!memberships.empty) {
        const membership = memberships.docs[0].data();
        return {
          userId: input.uid,
          tenantId: membership.tenantId as string,
          role: membership.role as Role,
          email: input.email
        };
      }

      const tenantId = makeId("ten");
      const membershipId = makeId("mem");
      await db.collection("tenants").doc(tenantId).set({
        name: `${input.displayName || input.email.split("@")[0]} Workspace`,
        ownerId: input.uid,
        createdAt: now
      });
      await db.collection("memberships").doc(membershipId).set({
        userId: input.uid,
        tenantId,
        role: "owner",
        createdAt: now
      });
      await db.collection("subscriptions").doc(tenantId).set({
        plan: "none",
        status: "inactive",
        stripeCustomerId: "",
        stripeSubscriptionId: "",
        updatedAt: now,
        createdAt: now
      });

      return { userId: input.uid, tenantId, role: "owner", email: input.email };
    },

    async listWorkspacesForUser(userId) {
      const db = getFirestoreDb();
      const memberships = await db.collection("memberships").where("userId", "==", userId).get();
      const workspaces = [];
      for (const membership of memberships.docs) {
        const data = membership.data();
        const tenant = await db.collection("tenants").doc(data.tenantId as string).get();
        workspaces.push({
          id: data.tenantId as string,
          name: (tenant.data()?.name as string) || "Workspace",
          role: data.role as Role
        });
      }
      return workspaces;
    },

    async createWorkspaceForUser(userId, name) {
      const db = getFirestoreDb();
      const tenantId = makeId("ten");
      const membershipId = makeId("mem");
      const now = new Date().toISOString();
      await db.collection("tenants").doc(tenantId).set({ name, ownerId: userId, createdAt: now });
      await db.collection("memberships").doc(membershipId).set({ userId, tenantId, role: "owner", createdAt: now });
      await db.collection("subscriptions").doc(tenantId).set({
        plan: "none",
        status: "inactive",
        stripeCustomerId: "",
        stripeSubscriptionId: "",
        createdAt: now,
        updatedAt: now
      });
      return { id: tenantId, name, role: "owner" };
    },

    async getSubscriptionForTenant(tenantId) {
      const db = getFirestoreDb();
      const doc = await db.collection("subscriptions").doc(tenantId).get();
      if (!doc.exists) return { plan: "none", status: "inactive", stripeCustomerId: "" };
      const data = doc.data() || {};
      return {
        plan: (data.plan as string) || "none",
        status: (data.status as string) || "inactive",
        stripeCustomerId: (data.stripeCustomerId as string) || "",
        stripeSubscriptionId: (data.stripeSubscriptionId as string) || ""
      };
    },

    async setSubscriptionForTenant(tenantId, input) {
      const db = getFirestoreDb();
      await db
        .collection("subscriptions")
        .doc(tenantId)
        .set({ ...input, updatedAt: new Date().toISOString() }, { merge: true });
    },

    async setTenantStripeCustomer(tenantId, stripeCustomerId) {
      const db = getFirestoreDb();
      await db.collection("tenants").doc(tenantId).set({ stripeCustomerId }, { merge: true });
      await db
        .collection("subscriptions")
        .doc(tenantId)
        .set({ stripeCustomerId, updatedAt: new Date().toISOString() }, { merge: true });
    },

    async isShareTokenTaken(shareToken, excludeProposalId) {
      const db = getFirestoreDb();
      const snap = await db.collection("proposals").where("shareToken", "==", shareToken).limit(1).get();
      if (snap.empty) return false;
      if (excludeProposalId && snap.docs[0].id === excludeProposalId) return false;
      return true;
    },

    async createProposal(input) {
      const db = getFirestoreDb();
      const id = makeId("prop");
      const shareToken = input.shareToken || makeId("share");
      const now = new Date().toISOString();
      const payload = {
        tenantId: input.tenantId,
        company: input.company,
        website: input.website,
        sector: input.sector,
        notes: input.notes,
        budget: input.budget,
        palette: input.palette,
        generatedHtml: input.generatedHtml || "",
        styleDirection: input.styleDirection || "",
        status: "draft" as ProposalStatus,
        shareToken,
        expiresAt: defaultShareExpiry(30),
        signedAt: "",
        signedBy: "",
        createdAt: now,
        updatedAt: now
      };
      await db.collection("proposals").doc(id).set(payload);
      return { id, shareToken, createdAt: now, expiresAt: payload.expiresAt };
    },

    async listTenantProposals(tenantId) {
      const db = getFirestoreDb();
      const snap = await db.collection("proposals").where("tenantId", "==", tenantId).get();
      return snap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ProposalRecord, "id">) }) as ProposalRecord)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async countTenantProposalsSince(tenantId, sinceIso) {
      const proposals = await this.listTenantProposals(tenantId);
      return proposals.filter((p) => p.createdAt >= sinceIso).length;
    },

    async getProposalById(id, tenantId) {
      const db = getFirestoreDb();
      const doc = await db.collection("proposals").doc(id).get();
      if (!doc.exists) return null;
      const data = doc.data() as Omit<ProposalRecord, "id">;
      if (tenantId && data.tenantId !== tenantId) return null;
      return { id: doc.id, ...data };
    },

    async getProposalByShareToken(shareToken) {
      const db = getFirestoreDb();
      const snap = await db.collection("proposals").where("shareToken", "==", shareToken).limit(1).get();
      if (snap.empty) return null;
      const doc = snap.docs[0];
      return { id: doc.id, ...(doc.data() as Omit<ProposalRecord, "id">) } as ProposalRecord;
    },

    async updateProposal(id, tenantId, patch) {
      const db = getFirestoreDb();
      const ref = db.collection("proposals").doc(id);
      const current = await ref.get();
      if (!current.exists || current.data()?.tenantId !== tenantId) return null;

      const cleanPatch = stripUndefinedPatch(patch);
      if (Object.keys(cleanPatch).length === 0) {
        return { id, ...(current.data() as Omit<ProposalRecord, "id">) } as ProposalRecord;
      }

      const updatedAt = new Date().toISOString();
      await ref.set({ ...cleanPatch, updatedAt }, { merge: true });
      const data = current.data() as Omit<ProposalRecord, "id">;
      return { id, ...data, ...cleanPatch, updatedAt };
    },

    async signProposalByToken(shareToken, signedBy) {
      const proposal = await this.getProposalByShareToken(shareToken);
      if (!proposal) return null;
      if (proposal.expiresAt && new Date(String(proposal.expiresAt)) < new Date()) {
        return { expired: true as const };
      }
      if (proposal.signedAt) {
        return { alreadySigned: true as const };
      }
      const db = getFirestoreDb();
      await db.collection("proposals").doc(proposal.id).set(
        {
          signedAt: new Date().toISOString(),
          signedBy,
          status: "approved",
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      return { ok: true as const, id: proposal.id };
    },

    async listAllTenantsWithDetails() {
      const db = getFirestoreDb();

      const tenantsSnap = await db.collection("tenants").get();
      const tenants = tenantsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

      const subsSnap = await db.collection("subscriptions").get();
      const subsMap = new Map<string, Record<string, unknown>>();
      subsSnap.docs.forEach((d) => subsMap.set(d.id, d.data() as Record<string, unknown>));

      const propsSnap = await db.collection("proposals").get();
      const propsCount = new Map<string, number>();
      propsSnap.docs.forEach((d) => {
        const data = d.data();
        if (data.tenantId) {
          propsCount.set(data.tenantId as string, (propsCount.get(data.tenantId as string) || 0) + 1);
        }
      });

      const usersSnap = await db.collection("users").get();
      const usersMap = new Map<string, Record<string, unknown>>();
      usersSnap.docs.forEach((d) => usersMap.set(d.id, d.data() as Record<string, unknown>));

      return tenants
        .map((t) => {
          const data = t as Record<string, unknown> & { id: string };
          const sub = subsMap.get(data.id) || { plan: "none", status: "inactive" };
          const user = usersMap.get(data.ownerId as string) || { email: "N/A" };
          const proposalsCount = propsCount.get(data.id) || 0;

          return {
            id: data.id,
            name: (data.name as string) || "Unknown",
            ownerId: data.ownerId as string,
            ownerEmail: (user.email as string) || "N/A",
            plan: sub.plan as string,
            status: sub.status as string,
            proposalsCount,
            createdAt: (data.createdAt as string) || ""
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
  };
}

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

    async cloneProposal(id, tenantId) {
      const original = await this.getProposalById(id, tenantId);
      if (!original) return null;
      const db = getFirestoreDb();
      const newId = makeId("prop");
      const newToken = makeId("share");
      const now = new Date().toISOString();
      const clone = {
        ...original,
        id: newId,
        shareToken: newToken,
        status: "draft" as ProposalStatus,
        signedAt: "",
        signedBy: "",
        clientComment: "",
        viewCount: 0,
        internalNotes: "",
        expiresAt: defaultShareExpiry(30),
        createdAt: now,
        updatedAt: now
      };
      const { id: _id, ...cloneData } = clone;
      await db.collection("proposals").doc(newId).set(cloneData);
      return { ...cloneData, id: newId } as ProposalRecord;
    },

    async incrementProposalViewCount(shareToken) {
      const db = getFirestoreDb();
      const snap = await db.collection("proposals").where("shareToken", "==", shareToken).limit(1).get();
      if (!snap.empty) {
        const current = (snap.docs[0].data().viewCount as number) || 0;
        await snap.docs[0].ref.update({ viewCount: current + 1 });
      }
    },

    async listProposalTemplates(tenantId) {
      const db = getFirestoreDb();
      const snap = await db.collection("proposals")
        .where("tenantId", "==", tenantId)
        .where("isTemplate", "==", true)
        .get();
      return snap.docs
        .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ProposalRecord, "id">) }) as ProposalRecord)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    },

    async getWorkspaceWebhookUrl(tenantId) {
      const db = getFirestoreDb();
      const doc = await db.collection("tenants").doc(tenantId).get();
      return (doc.data()?.webhookUrl as string) || "";
    },

    async setWorkspaceWebhookUrl(tenantId, url) {
      const db = getFirestoreDb();
      await db.collection("tenants").doc(tenantId).set({ webhookUrl: url }, { merge: true });
    },

    async listWorkspaceMembers(tenantId) {
      const db = getFirestoreDb();
      const memberships = await db.collection("memberships").where("tenantId", "==", tenantId).get();
      const members: import("@/lib/db/types").WorkspaceMember[] = [];
      for (const m of memberships.docs) {
        const data = m.data();
        const userDoc = await db.collection("users").doc(data.userId as string).get();
        const userData = userDoc.data() || {};
        members.push({
          userId: data.userId as string,
          tenantId,
          role: data.role as Role,
          email: (userData.email as string) || "",
          displayName: (userData.displayName as string) || "",
          joinedAt: (data.createdAt as string) || ""
        });
      }
      return members;
    },

    async countWorkspaceMembers(tenantId) {
      const db = getFirestoreDb();
      const snap = await db.collection("memberships").where("tenantId", "==", tenantId).count().get();
      return snap.data().count;
    },

    async removeWorkspaceMember(tenantId, userId) {
      const db = getFirestoreDb();
      const snap = await db.collection("memberships")
        .where("tenantId", "==", tenantId)
        .where("userId", "==", userId)
        .get();
      for (const doc of snap.docs) await doc.ref.delete();
    },

    async createWorkspaceInvite(tenantId, createdBy, role) {
      const db = getFirestoreDb();
      const token = Array.from(crypto.getRandomValues(new Uint8Array(18)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 32);
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const id = makeId("inv");
      const invite = { id, tenantId, token, role, createdBy, createdAt: now, expiresAt };
      await db.collection("workspace_invites").doc(id).set(invite);
      return invite;
    },

    async getWorkspaceInvite(token) {
      const db = getFirestoreDb();
      const snap = await db.collection("workspace_invites").where("token", "==", token).limit(1).get();
      if (snap.empty) return null;
      const data = snap.docs[0].data();
      return {
        id: snap.docs[0].id,
        tenantId: data.tenantId as string,
        token: data.token as string,
        role: data.role as Role,
        createdBy: data.createdBy as string,
        createdAt: data.createdAt as string,
        expiresAt: data.expiresAt as string,
        usedAt: data.usedAt as string | undefined,
        usedBy: data.usedBy as string | undefined
      };
    },

    async acceptWorkspaceInvite(token, userId, email, displayName) {
      const db = getFirestoreDb();
      const invite = await this.getWorkspaceInvite(token);
      if (!invite) return { error: "expired" as const };
      if (invite.usedAt) return { error: "already_used" as const };
      if (new Date(invite.expiresAt) < new Date()) return { error: "expired" as const };

      // Check member limit
      const subscription = await this.getSubscriptionForTenant(invite.tenantId);
      const limits = (await import("@/lib/billing/plans")).getPlanLimits(subscription.plan);
      const memberCount = await this.countWorkspaceMembers(invite.tenantId);
      if (limits && memberCount >= limits.memberLimit) return { error: "member_limit" as const };

      const now = new Date().toISOString();

      // Add membership
      const membershipId = makeId("mem");
      await db.collection("memberships").doc(membershipId).set({
        userId, tenantId: invite.tenantId, role: invite.role, createdAt: now
      });

      // Mark invite as used
      const snap = await db.collection("workspace_invites").where("token", "==", token).limit(1).get();
      if (!snap.empty) await snap.docs[0].ref.update({ usedAt: now, usedBy: userId });

      // Update user doc
      await db.collection("users").doc(userId).set(
        { email, displayName: displayName || "", updatedAt: now },
        { merge: true }
      );

      return { userId, tenantId: invite.tenantId, role: invite.role, email };
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

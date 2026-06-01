import { getFirestoreDb } from "@/lib/firebase/admin";

export type Role = "owner" | "admin" | "editor" | "viewer";
export type ProposalStatus = "draft" | "review" | "approved" | "sent";

export type ProposalRecord = {
  id: string;
  tenantId: string;
  company: string;
  website: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
  generatedHtml: string;
  styleDirection: string;
  status: ProposalStatus;
  shareToken: string;
  expiresAt: string;
  signedAt: string;
  signedBy: string;
  createdAt: string;
  updatedAt: string;
};

export function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultShareExpiry(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function upsertUserFromFirebase(input: {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}) {
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

  return { userId: input.uid, tenantId, role: "owner" as const, email: input.email };
}

export async function listWorkspacesForUser(userId: string) {
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
}

export async function createWorkspaceForUser(userId: string, name: string) {
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
  return { id: tenantId, name, role: "owner" as const };
}

export async function getSubscriptionForTenant(tenantId: string) {
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
}

export async function setSubscriptionForTenant(
  tenantId: string,
  input: {
    plan: string;
    status: string;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
  }
) {
  const db = getFirestoreDb();
  await db
    .collection("subscriptions")
    .doc(tenantId)
    .set({ ...input, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function setTenantStripeCustomer(tenantId: string, stripeCustomerId: string) {
  const db = getFirestoreDb();
  await db.collection("tenants").doc(tenantId).set({ stripeCustomerId }, { merge: true });
  await db.collection("subscriptions").doc(tenantId).set({ stripeCustomerId, updatedAt: new Date().toISOString() }, { merge: true });
}

export async function createProposal(input: {
  tenantId: string;
  company: string;
  website: string;
  sector: string;
  notes: string;
  budget: number;
  palette: string[];
  generatedHtml?: string;
  styleDirection?: string;
}) {
  const db = getFirestoreDb();
  const id = makeId("prop");
  const shareToken = makeId("share");
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
}

export async function listTenantProposals(tenantId: string) {
  const db = getFirestoreDb();
  const snap = await db.collection("proposals").where("tenantId", "==", tenantId).get();
  return snap.docs
    .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<ProposalRecord, "id">) }) as ProposalRecord)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProposalById(id: string, tenantId?: string) {
  const db = getFirestoreDb();
  const doc = await db.collection("proposals").doc(id).get();
  if (!doc.exists) return null;
  const data = doc.data() as Omit<ProposalRecord, "id">;
  if (tenantId && data.tenantId !== tenantId) return null;
  return { id: doc.id, ...data };
}

export async function getProposalByShareToken(shareToken: string) {
  const db = getFirestoreDb();
  const snap = await db.collection("proposals").where("shareToken", "==", shareToken).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...(doc.data() as Omit<ProposalRecord, "id">) } as ProposalRecord;
}

export async function updateProposal(
  id: string,
  tenantId: string,
  patch: Partial<{
    status: ProposalStatus;
    generatedHtml: string;
    expiresAt: string;
    signedAt: string;
    signedBy: string;
  }>
) {
  const db = getFirestoreDb();
  const ref = db.collection("proposals").doc(id);
  const current = await ref.get();
  if (!current.exists || current.data()?.tenantId !== tenantId) return null;
  await ref.set({ ...patch, updatedAt: new Date().toISOString() }, { merge: true });
  return { id, ...(current.data() as Record<string, unknown>), ...patch };
}

export async function signProposalByToken(shareToken: string, signedBy: string) {
  const proposal = await getProposalByShareToken(shareToken);
  if (!proposal) return null;
  if (proposal.expiresAt && new Date(String(proposal.expiresAt)) < new Date()) {
    return { expired: true as const };
  }
  const db = getFirestoreDb();
  await db
    .collection("proposals")
    .doc(proposal.id as string)
    .set(
      {
        signedAt: new Date().toISOString(),
        signedBy,
        status: "approved",
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  return { ok: true as const, id: proposal.id as string };
}

// ADMIN METHODS

export async function listAllTenantsWithDetails() {
  const db = getFirestoreDb();
  
  // 1. Fetch all tenants
  const tenantsSnap = await db.collection("tenants").get();
  const tenants = tenantsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  // 2. Fetch all subscriptions
  const subsSnap = await db.collection("subscriptions").get();
  const subsMap = new Map();
  subsSnap.docs.forEach(d => subsMap.set(d.id, d.data()));

  // 3. Fetch all proposals to count them
  const propsSnap = await db.collection("proposals").get();
  const propsCount = new Map();
  propsSnap.docs.forEach(d => {
    const data = d.data();
    if (data.tenantId) {
      propsCount.set(data.tenantId, (propsCount.get(data.tenantId) || 0) + 1);
    }
  });

  // 4. Fetch all users to map ownerId -> email
  const usersSnap = await db.collection("users").get();
  const usersMap = new Map();
  usersSnap.docs.forEach(d => usersMap.set(d.id, d.data()));

  return tenants.map(t => {
    const data = t as any;
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
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

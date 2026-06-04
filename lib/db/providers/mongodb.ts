import type { DatabaseRepository } from "@/lib/db/repository";

const MSG =
  "MongoDB provider is not implemented yet. Set DATABASE_PROVIDER=firestore or implement lib/db/providers/mongodb.ts.";

function notImplemented(): never {
  throw new Error(MSG);
}

/**
 * Stub MongoDB — stessa interfaccia di Firestore.
 * Implementare con driver ufficiale (`mongodb`) e collezioni equivalenti:
 * users, tenants, memberships, subscriptions, proposals.
 */
export function createMongoRepository(): DatabaseRepository {
  return {
    upsertUserFromFirebase: notImplemented,
    listWorkspacesForUser: notImplemented,
    createWorkspaceForUser: notImplemented,
    getSubscriptionForTenant: notImplemented,
    setSubscriptionForTenant: notImplemented,
    setTenantStripeCustomer: notImplemented,
    isShareTokenTaken: notImplemented,
    createProposal: notImplemented,
    listTenantProposals: notImplemented,
    countTenantProposalsSince: notImplemented,
    getProposalById: notImplemented,
    getProposalByShareToken: notImplemented,
    updateProposal: notImplemented,
    signProposalByToken: notImplemented,
    listAllTenantsWithDetails: notImplemented,
    cloneProposal: notImplemented,
    incrementProposalViewCount: notImplemented,
    listProposalTemplates: notImplemented,
    getWorkspaceWebhookUrl: notImplemented,
    setWorkspaceWebhookUrl: notImplemented,
    listWorkspaceMembers: notImplemented,
    countWorkspaceMembers: notImplemented,
    removeWorkspaceMember: notImplemented,
    createWorkspaceInvite: notImplemented,
    getWorkspaceInvite: notImplemented,
    acceptWorkspaceInvite: notImplemented
  };
}

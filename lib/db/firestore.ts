/**
 * @deprecated Importa da `@/lib/db/repositories` o `@/lib/db/types`.
 * Mantenuto per compatibilità con import legacy.
 */
export * from "@/lib/db/types";
export {
  upsertUserFromFirebase,
  listWorkspacesForUser,
  createWorkspaceForUser,
  getSubscriptionForTenant,
  setSubscriptionForTenant,
  setTenantStripeCustomer,
  isShareTokenTaken,
  createProposal,
  listTenantProposals,
  countTenantProposalsSince,
  getProposalById,
  getProposalByShareToken,
  updateProposal,
  signProposalByToken,
  listAllTenantsWithDetails
} from "@/lib/db/repositories";

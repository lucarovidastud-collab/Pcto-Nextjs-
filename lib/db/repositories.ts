/**
 * API pubblica del persistence layer.
 * Il resto dell'app importa solo da qui — mai da firebase/admin o da provider specifici.
 */
import { getRepository } from "@/lib/db/get-repository";
import type { DatabaseRepository } from "@/lib/db/repository";

export * from "@/lib/db/types";
export type { DatabaseRepository } from "@/lib/db/repository";
export { getDatabaseProvider, getRepository, resetRepositoryForTests } from "@/lib/db/get-repository";

type Repo = DatabaseRepository;

export const upsertUserFromFirebase: Repo["upsertUserFromFirebase"] = (input) =>
  getRepository().upsertUserFromFirebase(input);

export const listWorkspacesForUser: Repo["listWorkspacesForUser"] = (userId) =>
  getRepository().listWorkspacesForUser(userId);

export const createWorkspaceForUser: Repo["createWorkspaceForUser"] = (userId, name) =>
  getRepository().createWorkspaceForUser(userId, name);

export const getSubscriptionForTenant: Repo["getSubscriptionForTenant"] = (tenantId) =>
  getRepository().getSubscriptionForTenant(tenantId);

export const setSubscriptionForTenant: Repo["setSubscriptionForTenant"] = (tenantId, input) =>
  getRepository().setSubscriptionForTenant(tenantId, input);

export const setTenantStripeCustomer: Repo["setTenantStripeCustomer"] = (tenantId, stripeCustomerId) =>
  getRepository().setTenantStripeCustomer(tenantId, stripeCustomerId);

export const isShareTokenTaken: Repo["isShareTokenTaken"] = (shareToken, excludeProposalId) =>
  getRepository().isShareTokenTaken(shareToken, excludeProposalId);

export const createProposal: Repo["createProposal"] = (input) => getRepository().createProposal(input);

export const listTenantProposals: Repo["listTenantProposals"] = (tenantId) =>
  getRepository().listTenantProposals(tenantId);

export const countTenantProposalsSince: Repo["countTenantProposalsSince"] = (tenantId, sinceIso) =>
  getRepository().countTenantProposalsSince(tenantId, sinceIso);

export const getProposalById: Repo["getProposalById"] = (id, tenantId) =>
  getRepository().getProposalById(id, tenantId);

export const getProposalByShareToken: Repo["getProposalByShareToken"] = (shareToken) =>
  getRepository().getProposalByShareToken(shareToken);

export const updateProposal: Repo["updateProposal"] = (id, tenantId, patch) =>
  getRepository().updateProposal(id, tenantId, patch);

export const signProposalByToken: Repo["signProposalByToken"] = (shareToken, signedBy) =>
  getRepository().signProposalByToken(shareToken, signedBy);

export const listAllTenantsWithDetails: Repo["listAllTenantsWithDetails"] = () =>
  getRepository().listAllTenantsWithDetails();

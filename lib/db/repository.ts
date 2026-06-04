import type {
  ProposalRecord,
  ProposalStatus,
  Role,
  SubscriptionRecord,
  TenantAdminRow,
  UserSession,
  WorkspaceInvite,
  WorkspaceMember,
  WorkspaceSummary
} from "@/lib/db/types";

/** Contratto unico per il persistence layer — indipendente da Firebase/MongoDB. */
export interface DatabaseRepository {
  upsertUserFromFirebase(input: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }): Promise<UserSession>;

  listWorkspacesForUser(userId: string): Promise<WorkspaceSummary[]>;
  createWorkspaceForUser(userId: string, name: string): Promise<WorkspaceSummary>;

  getSubscriptionForTenant(tenantId: string): Promise<SubscriptionRecord>;
  setSubscriptionForTenant(
    tenantId: string,
    input: {
      plan: string;
      status: string;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    }
  ): Promise<void>;
  setTenantStripeCustomer(tenantId: string, stripeCustomerId: string): Promise<void>;

  isShareTokenTaken(shareToken: string, excludeProposalId?: string): Promise<boolean>;

  createProposal(input: {
    tenantId: string;
    company: string;
    website: string;
    sector: string;
    notes: string;
    budget: number;
    palette: string[];
    generatedHtml?: string;
    styleDirection?: string;
    shareToken?: string;
  }): Promise<{ id: string; shareToken: string; createdAt: string; expiresAt: string }>;

  listTenantProposals(tenantId: string): Promise<ProposalRecord[]>;
  countTenantProposalsSince(tenantId: string, sinceIso: string): Promise<number>;
  getProposalById(id: string, tenantId?: string): Promise<ProposalRecord | null>;
  getProposalByShareToken(shareToken: string): Promise<ProposalRecord | null>;
  updateProposal(
    id: string,
    tenantId: string,
    patch: Partial<{
      status: ProposalStatus;
      generatedHtml: string;
      expiresAt: string;
      signedAt: string;
      signedBy: string;
      internalNotes: string;
    }>
  ): Promise<ProposalRecord | null>;
  signProposalByToken(
    shareToken: string,
    signedBy: string
  ): Promise<{ ok: true; id: string } | { expired: true } | { alreadySigned: true } | null>;

  listAllTenantsWithDetails(): Promise<TenantAdminRow[]>;

  // Workspace members
  listWorkspaceMembers(tenantId: string): Promise<WorkspaceMember[]>;
  countWorkspaceMembers(tenantId: string): Promise<number>;
  removeWorkspaceMember(tenantId: string, userId: string): Promise<void>;

  // Workspace invites
  createWorkspaceInvite(tenantId: string, createdBy: string, role: Role): Promise<WorkspaceInvite>;
  getWorkspaceInvite(token: string): Promise<WorkspaceInvite | null>;
  acceptWorkspaceInvite(token: string, userId: string, email: string, displayName?: string): Promise<UserSession | { error: "expired" | "already_used" | "member_limit" }>;
}

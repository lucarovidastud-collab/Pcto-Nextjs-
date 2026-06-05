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
  /** JSON strutturato (v1) per rendering React; assente sui preventivi legacy. */
  generatedDocument?: string;
  styleDirection: string;
  style: string;
  internalNotes: string;
  status: ProposalStatus;
  shareToken: string;
  password: string;
  viewCount: number;
  clientComment: string;
  expiresAt: string;
  signedAt: string;
  signedBy: string;
  webhookUrl: string;
  isTemplate: boolean;
  templateName: string;
  createdAt: string;
  updatedAt: string;
};

export type UserSession = {
  userId: string;
  tenantId: string;
  role: Role;
  email: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  role: Role;
};

export type SubscriptionRecord = {
  plan: string;
  status: string;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
};

export type WorkspaceMember = {
  userId: string;
  tenantId: string;
  role: Role;
  email: string;
  displayName: string;
  joinedAt: string;
};

export type WorkspaceInvite = {
  id: string;
  tenantId: string;
  token: string;
  role: Role;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  usedAt?: string;
  usedBy?: string;
};

export type TenantAdminRow = {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  plan: string;
  status: string;
  proposalsCount: number;
  createdAt: string;
};

export function makeId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function defaultShareExpiry(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}

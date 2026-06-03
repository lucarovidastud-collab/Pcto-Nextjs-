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

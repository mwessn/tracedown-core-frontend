import type { OrgSectionPermissions } from '@/data/orgs/PermissionDto';

export interface InviteRequest {
  email: string;
  /** Groups to pre-assign — the member lands fully provisioned. */
  groupIds?: string[];
}

export interface InviteResponse {
  ok: boolean;
}

export interface PendingInvite {
  id: string;
  /** The stub user's id — group membership calls key off it. */
  userId: string;
  email: string;
  invitedAt: string;
  expiresAt: string;
  /** Pre-assigned groups the member joins on acceptance. */
  groupIds: string[];
  /** Individual org-section levels, pre-configurable like an active member's. */
  org?: OrgSectionPermissions;
}

/** Response of GET /invites/{token} — public info for the accept form. */
export interface InviteInfo {
  orgName: string;
  email: string;
  /** True when the invited email already has an account (must be signed in to accept). */
  userExists: boolean;
}

/** Request of POST /invites/{token}/accept — password/name only for a new user. */
export interface AcceptInviteRequest {
  password?: string;
  displayName?: string;
}

/** Response of POST /invites/{token}/accept. */
export interface AcceptInviteResponse {
  status: 'accepted_new' | 'accepted_existing' | 'login_required';
  /** A fresh session token scoped to the joined org (both accepted paths). */
  token?: string;
  /** The invited email (login_required) — to prefill the login prompt. */
  email?: string;
}

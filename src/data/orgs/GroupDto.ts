export interface GroupSummary {
  id: string;
  name: string;
  users: number;
  settings: number;
  domains: number;
  webhooks: number;
  notifications: number;
  admin: number;
  workspaces: number;
  /** Members of this group must have TOTP enrolled. */
  totpRequired: boolean;
  memberCount: number;
}

export interface GroupMember {
  userId: string;
  email: string;
  displayName: string;
}

export interface CreateGroupRequest {
  name: string;
}

/** PATCH body — only non-null fields are applied. */
export interface UpdateGroupRequest {
  name?: string;
  users?: number;
  settings?: number;
  domains?: number;
  webhooks?: number;
  notifications?: number;
  admin?: number;
  workspaces?: number;
  totpRequired?: boolean;
}

export interface AddMemberRequest {
  userId: string;
}

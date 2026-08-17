/**
 * Permission level per org section: 0 none, 1 read, 2 write. The named fields
 * are always present; the index signature lets host-registered section keys
 * survive (de)serialization alongside them.
 */
export interface OrgSectionPermissions {
  users: number;
  settings: number;
  domains: number;
  webhooks: number;
  notifications: number;
  admin: number;
  workspaces: number;
  [section: string]: number;
}

/** Resource kinds accepting per-resource grants (singular, per the API). */
export type GrantResourceType = 'workspace' | 'project' | 'service';

export interface ResourceGrant {
  resourceType: GrantResourceType;
  resourceId: string;
  permissions: number;
}

/** Full permission view for a user or group: org sections + resource grants. */
export interface PermissionSet {
  org: OrgSectionPermissions;
  resources: ResourceGrant[];
}

/** PATCH body — omitted fields are left unchanged (resources replace diff-based). */
export interface UpdatePermissionsRequest {
  org?: OrgSectionPermissions;
  resources?: ResourceGrant[];
}

/** One organization member as returned by GET /users. */
export interface OrgUserSummary {
  userId: string;
  email: string;
  displayName: string;
  isOwner: boolean;
  isActive: boolean;
  org: OrgSectionPermissions;
  /** Ids of the groups this member belongs to. */
  groupIds: string[];
}

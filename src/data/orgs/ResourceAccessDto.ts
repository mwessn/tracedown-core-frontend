export type AccessPrincipalType = 'user' | 'group';

/** One principal holding a grant on a resource (GET /access/{type}/{id}). */
export interface ResourceAccessEntry {
  principalType: AccessPrincipalType;
  /** userId for users, groupId for groups. */
  principalId: string;
  name: string;
  email?: string | null;
  permissions: number;
}

/** Request of PUT /access/{type}/{id}. */
export interface UpsertAccessRequest {
  principalType: AccessPrincipalType;
  principalId: string;
  permissions: number;
}

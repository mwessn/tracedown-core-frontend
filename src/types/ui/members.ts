import type { OrgSectionPermissions } from '@/data/orgs/PermissionDto';

/**
 * The member slice the user-detail panel needs — active org members and
 * pending invites both satisfy it structurally.
 */
export interface DetailMember {
  userId: string;
  groupIds: string[];
  org: OrgSectionPermissions;
}

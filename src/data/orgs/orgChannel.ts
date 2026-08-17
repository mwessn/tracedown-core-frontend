/**
 * Live channel for the active organization — key doubles as the realtime
 * channel name (`org:{orgId}`). Acquired globally while a session is active
 * (see OrgLiveSync) so org-scoped admin data stays in sync across users.
 *
 * State is the org settings object (`/org/settings`); the admin events carry
 * ids only and are folded into the stores via `onEvent` side effects.
 */

import { defineChannel } from '@/requests';
import type { OrgSettings } from '@/data/orgs/OrgSettingsDto';

type OrgChannelEvents = {
  'workspace.created': { workspaceId: string };
  'workspace.updated': { workspaceId: string };
  'workspace.deleted': { workspaceId: string };
  'settings.updated': Record<string, never>;
  'invite.created': Record<string, never>;
  'invite.revoked': Record<string, never>;
  'user.joined': { userId: string };
  'user.updated': { userId: string };
  'user.removed': { userId: string };
  'ownership.transferred': { fromUserId: string; toUserId: string };
  'access.changed': { resourceType: string; resourceId: string };
  'user.permissions.updated': { userId: string };
  'group.created': { groupId: string };
  'group.updated': { groupId: string };
  'group.deleted': { groupId: string };
  'group.members.updated': { groupId: string };
  /** Platform alert episode started (capacity, agent health, …). */
  'system.alert': { alertType: string; subject: string };
};

export const orgChannel = defineChannel<
  OrgSettings,
  OrgSettings,
  OrgSettings,
  OrgChannelEvents
>()({
  key: (orgId: string) => `org:${orgId}`,
  firstFetchUrl: () => '/org/settings',
  pollUrl: () => '/org/settings',
  pollFreqMs: 60000,
});

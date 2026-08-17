<template>
    <slot />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRouter } from 'vue-router';
import { useLiveChannel } from '@/requests';
import { orgChannel } from '@/data/orgs/orgChannel';
import { initSession } from '@/composables/useSessionInit';
import { useAuthStore } from '@/store/core/auth';
import { useOrgStore } from '@/store/core/org';
import { useWorkspaceStore } from '@/store/core/workspace';
import { useOrgUserStore } from '@/store/core/orgUser';
import { useGroupStore } from '@/store/core/group';
import { useResourceAccessStore } from '@/store/core/resourceAccess';
import { useSystemAlertStore } from '@/store/core/systemAlert';

/**
 * Renderless subscriber to the org channel — mounted once inside the
 * authorized layout (per selected org, via `:key` upstream). Folds org-scoped
 * admin events into the stores so every session stays in sync.
 */
const props = defineProps<{
  orgId: string;
}>();

const router = useRouter();
const authStore = useAuthStore();
const orgStore = useOrgStore();
const workspaceStore = useWorkspaceStore();
const orgUserStore = useOrgUserStore();
const groupStore = useGroupStore();
const resourceAccessStore = useResourceAccessStore();
const systemAlertStore = useSystemAlertStore();

/**
 * Re-scopes the session after we've been disabled or removed from the current org.
 * `initSession` drops an org the token can no longer reach and switches to a valid
 * one; if that changed the active org we bounce to home so no stale, now
 * inaccessible page stays open. A hard failure (no session) sends us to login.
 */
async function evictSelfIfLostAccess() {
  const before = orgStore.selectedOrgId;
  const ok = await initSession();
  if (!ok) {
    await router.push({ name: 'login' });
    return;
  }
  if (orgStore.selectedOrgId !== before) {
    await router.push({ name: 'home' });
  }
}

const { state } = useLiveChannel(orgChannel, () => props.orgId, {
  onEvent: (event) => {
    switch (event.type) {
      case 'workspace.created':
      case 'workspace.updated':
      case 'workspace.deleted':
        void workspaceStore.fetchWorkspaces({ silent: true });
        break;
      case 'settings.updated':
        void orgStore.fetchSettings({ silent: true });
        break;
      case 'invite.created':
      case 'invite.revoked':
        orgUserStore.refreshInvites();
        break;
      case 'user.joined':
        orgUserStore.refreshUsers();
        // Joining consumes the invite — drop it from the pending list too.
        orgUserStore.refreshInvites();
        break;
      case 'user.updated':
      case 'user.removed':
        // If it's us, we may have just been disabled/removed from THIS org —
        // re-scope the session away from it rather than leaving the stale, now
        // inaccessible, cached UI navigable. Otherwise just refresh the roster.
        if (event.data.userId === authStore.user?.id) {
          void evictSelfIfLostAccess();
        } else {
          orgUserStore.refreshUsers();
        }
        break;
      case 'access.changed':
        resourceAccessStore.refreshIfCurrent(event.data.resourceType, event.data.resourceId);
        break;
      case 'ownership.transferred':
        orgUserStore.refreshUsers();
        // Owner status feeds permission checks everywhere — refresh our own.
        void authStore.fetchMe();
        orgUserStore.refreshInvites();
        break;
      case 'user.permissions.updated':
        orgUserStore.refreshUsers();
        // Our own permissions changed — refresh the session's matrix so the
        // ribbon, tabs and edit affordances follow immediately.
        if (event.data.userId === authStore.user?.id) {
          void authStore.fetchMe();
        }
        break;
      case 'group.created':
        groupStore.refreshGroups();
        break;
      case 'group.updated':
      case 'group.deleted':
      case 'group.members.updated':
        groupStore.refreshGroups();
        // Group permissions/grants/membership feed our own effective grants
        // (bells, scoped tabs). The event doesn't say whether we're affected,
        // so resync the session matrix silently.
        void authStore.fetchMe();
        break;
      case 'system.alert':
        // Platform alert episode started — refresh banners for admins.
        if (authStore.canWrite('settings')) void systemAlertStore.fetchAlerts();
        break;
    }
  },
});

// Banner load for admins on ORG SWITCH only — the initial page load is
// pre-seeded by the session bulk (consumeSeed), sparing a mount round-trip.
if (!systemAlertStore.consumeSeed()) {
  systemAlertStore.clear();
  if (authStore.canWrite('settings')) void systemAlertStore.fetchAlerts();
}

// Polling mode delivers no events — sync the settings from the polled state.
watch(state, (settings) => {
  if (settings) {
    orgStore.totpRequired = settings.totpRequired;
  }
});
</script>

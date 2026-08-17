<template>
    <div class="px-gutter py-4 space-y-3 max-w-xl">
      <SectionHeading :label="t('account.sessionsSection')" />

      <p class="text-sm text-text-secondary">
        {{ t('account.sessionsHint') }}
      </p>

      <EmptyState
        v-if="sessionStore.sessions.length === 0"
        compact
        :message="t('account.noSessions')"
      />
      <ul
        v-else
        class="divide-y divide-text-secondary/15"
      >
        <li
          v-for="session in sessionStore.sessions"
          :key="session.id"
          class="flex items-center gap-3 py-2"
        >
          <FontAwesomeIcon
            :icon="faDesktop"
            class="w-3.5 h-3.5 text-text-secondary shrink-0"
          />
          <div class="min-w-0">
            <p class="text-sm text-text-primary truncate">
              {{ session.userAgent ?? t('account.unknownDevice') }}
            </p>
            <p class="text-xs text-text-secondary truncate">
              {{ session.ipAddress ?? t('account.unknownIp') }}
              · {{ t('account.sessionActive', { when: formatAgo(session.lastActiveAt) }) }}
            </p>
          </div>
          <BadgePill
            v-if="session.current"
            class="ml-auto"
            color-class="bg-status-success/10 text-status-success"
            :label="t('account.currentSession')"
          />
          <IconButton
            v-else
            class="ml-auto"
            :fa-icon="faRightFromBracket"
            :title="t('account.revokeSession')"
            color-class="text-text-secondary hover:text-status-failure"
            icon-class="w-3.5 h-3.5"
            @click="handleRevoke(session.id)"
          />
        </li>
      </ul>

      <DangerButton
        v-if="otherCount > 0"
        :label-text="t('account.revokeOthers')"
        :loading="revokingOthers"
        :hold-offset-sec="3"
        @safe-click="handleRevokeOthers"
      />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faDesktop, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import BadgePill from '@/components/core/BadgePill.vue';
import DangerButton from '@/components/core/buttons/DangerButton.vue';
import EmptyState from '@/components/core/EmptyState.vue';
import IconButton from '@/components/core/buttons/IconButton.vue';
import SectionHeading from '@/components/core/SectionHeading.vue';
import { useSessionStore } from '@/store/core/session';
import { useNotificationStore } from '@/store/ui/notifications';
import { useRelativeTime } from '@/composables/useRelativeTime';

/**
 * Active login sessions: one row per session with a revoke action, the
 * current session marked and non-revocable, plus a bulk "sign out others".
 */
const { t } = useI18n();
const sessionStore = useSessionStore();
const notifications = useNotificationStore();
const { formatAgo } = useRelativeTime();

const revokingOthers = ref<boolean>(false);

const otherCount = computed(() =>
  sessionStore.sessions.filter(s => !s.current).length);

async function handleRevoke(id: string) {
  const result = await sessionStore.revokeSession(id);
  if (!result.ok) {
    notifications.show(result.message ?? t('common.states.error'), 'error');
    return;
  }
  notifications.show(t('account.sessionRevoked'), 'success');
}

async function handleRevokeOthers() {
  if (revokingOthers.value) return;
  revokingOthers.value = true;
  try {
    const result = await sessionStore.revokeOthers();
    if (!result.ok) {
      notifications.show(result.message ?? t('common.states.error'), 'error');
      return;
    }
    notifications.show(t('account.othersRevoked'), 'success');
  } finally {
    revokingOthers.value = false;
  }
}

onMounted(() => {
  void sessionStore.fetchSessions();
});
</script>

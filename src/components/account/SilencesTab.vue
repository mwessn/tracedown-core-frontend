<template>
    <div class="px-gutter py-4 space-y-8">
      <div class="space-y-3">
        <SectionHeading :label="t('account.silencesSection')" />

        <EmptyState
          v-if="scopedSilences.length === 0"
          compact
          :message="t('account.noSilences')"
        />
        <ul
          v-else
          class="divide-y divide-text-secondary/15 max-w-xl"
        >
          <li
            v-for="silence in scopedSilences"
            :key="silence.id"
            class="flex items-center gap-3 py-2"
          >
            <FontAwesomeIcon
              :icon="faBellSlash"
              class="w-3.5 h-3.5 text-status-warning shrink-0"
            />
            <span class="text-sm text-text-primary truncate">
              {{ silence.resourceName ?? t('account.everything') }}
            </span>
            <BadgePill
              color-class="bg-text-secondary/10 text-text-secondary"
              :label="t(`account.scopes.${scopeOf(silence)}`)"
            />
            <IconButton
              class="ml-auto"
              :fa-icon="faTrash"
              :title="t('silences.unmute')"
              color-class="text-text-secondary hover:text-status-failure"
              icon-class="w-3.5 h-3.5"
              @click="handleRemove(silence)"
            />
          </li>
        </ul>
      </div>

      <QuietHoursEditor />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faBellSlash, faTrash } from '@fortawesome/free-solid-svg-icons';
import BadgePill from '@/components/core/BadgePill.vue';
import EmptyState from '@/components/core/EmptyState.vue';
import IconButton from '@/components/core/buttons/IconButton.vue';
import SectionHeading from '@/components/core/SectionHeading.vue';
import QuietHoursEditor from '@/components/account/QuietHoursEditor.vue';
import { useSilenceStore } from '@/store/core/silence';
import { useNotificationStore } from '@/store/ui/notifications';
import type { SilenceSummary } from '@/data/silences/SilenceDto';

/**
 * Personal notification silences: every bell-created mute in one list
 * (removable here too), plus the account-wide quiet-hours window.
 */
const { t } = useI18n();
const silenceStore = useSilenceStore();
const notifications = useNotificationStore();

/** Bell-created mutes only — the quiet-hours carrier row is not a mute. */
const scopedSilences = computed(() =>
  silenceStore.silences.filter(s => s.channel !== 'quiet-hours'));

function scopeOf(silence: SilenceSummary): string {
  if (silence.serviceId) return 'service';
  if (silence.projectId) return 'project';
  if (silence.workspaceId) return 'workspace';
  return 'global';
}

async function handleRemove(silence: SilenceSummary) {
  const result = await silenceStore.remove(silence.id);
  if (!result.ok && result.message) notifications.show(result.message, 'error');
}

onMounted(() => {
  void silenceStore.ensureLoaded();
});
</script>

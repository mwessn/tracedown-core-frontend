<template>
    <div class="space-y-3 max-w-md">
      <SectionHeading :label="t('account.quietHours.title')" />
      <p class="text-sm text-text-secondary">
        {{ t('account.quietHours.hint') }}
      </p>

      <!-- Reuses the service maintenance-window builder: quiet hours share the
           same RRULE[/durationMinutes[/timezone]] recurrence format. -->
      <ServiceWindowEditor
        v-model="rule"
        v-model:valid="valid"
      />

      <div class="flex items-center gap-2">
        <PrimaryButton
          :label-text="t('common.actions.save')"
          :loading="saving"
          :on-click="handleSave"
        />
        <GhostButton
          v-if="carrier"
          :label-text="t('account.quietHours.clear')"
          :loading="saving"
          :on-click="handleClear"
        />
        <BadgePill
          v-if="carrier"
          color-class="bg-status-warning/10 text-status-warning"
          :label="t('account.quietHours.active', { window: windowLabel })"
        />
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PrimaryButton from '@/components/core/buttons/PrimaryButton.vue';
import GhostButton from '@/components/core/buttons/GhostButton.vue';
import BadgePill from '@/components/core/BadgePill.vue';
import SectionHeading from '@/components/core/SectionHeading.vue';
import ServiceWindowEditor from '@/components/service/detail/ServiceWindowEditor.vue';
import { useSilenceStore } from '@/store/core/silence';
import { useNotificationStore } from '@/store/ui/notifications';
import { formatWindowTime, parseServiceWindowRule } from '@/lib/serviceWindow';

/**
 * Account-wide notification quiet hours, stored as an RRULE recurrence spec
 * (the same format as the service maintenance window). Held on a dedicated
 * carrier silence row (channel "quiet-hours") that matches no dispatch channel
 * — it carries the window without muting anything itself.
 */
const { t } = useI18n();
const silenceStore = useSilenceStore();
const notifications = useNotificationStore();

const rule = ref<string>('');
const valid = ref<boolean>(true);
const saving = ref<boolean>(false);

/** The carrier row, when quiet hours are configured. */
const carrier = computed(() =>
  silenceStore.silences.find(s => s.channel === 'quiet-hours') ?? null);

/** Compact readable window ("22:00–07:00 Europe/Amsterdam"), else the raw rule. */
const windowLabel = computed(() => {
  const stored = carrier.value?.quietHours;
  if (!stored) return '';
  const parsed = parseServiceWindowRule(stored);
  if (!parsed) return stored;
  const range = `${formatWindowTime(parsed.start)}–${formatWindowTime(parsed.end)}`;
  return parsed.timezone ? `${range} ${parsed.timezone}` : range;
});

// Reflect the stored rule into the builder once loaded.
watch(carrier, (row) => {
  rule.value = row?.quietHours ?? '';
}, { immediate: true });

async function handleSave() {
  if (saving.value || !valid.value) return;
  saving.value = true;
  try {
    const quietHours = rule.value.trim();
    // An empty rule means "no quiet hours" — remove the carrier if one exists.
    if (!quietHours) {
      if (carrier.value) {
        const removed = await silenceStore.remove(carrier.value.id);
        if (!removed.ok) {
          if (removed.message) notifications.show(removed.message, 'error');
          return;
        }
      }
      notifications.show(t('account.quietHours.saved'), 'success');
      return;
    }
    const result = carrier.value
      ? await silenceStore.update(carrier.value.id, { quietHours })
      : await silenceStore.createRaw({ channel: 'quiet-hours', quietHours });
    if (!result.ok) {
      notifications.show(result.message ?? t('common.states.error'), 'error');
      return;
    }
    notifications.show(t('account.quietHours.saved'), 'success');
  } finally {
    saving.value = false;
  }
}

async function handleClear() {
  if (!carrier.value || saving.value) return;
  saving.value = true;
  try {
    const result = await silenceStore.remove(carrier.value.id);
    if (!result.ok && result.message) notifications.show(result.message, 'error');
    else rule.value = '';
  } finally {
    saving.value = false;
  }
}
</script>

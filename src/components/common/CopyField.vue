<template>
    <div>
      <p
        v-if="label"
        class="text-xs text-text-secondary mb-1"
      >
        {{ label }}
      </p>
      <div
        class="flex gap-2"
        :class="multiline ? 'items-start' : 'items-center'"
      >
        <pre
          v-if="multiline"
          class="flex-1 overflow-x-auto whitespace-pre"
          :class="valueClass"
        >{{ value }}</pre>
        <code
          v-else
          class="break-all"
          :class="valueClass"
        >{{ value }}</code>
        <IconButton
          :fa-icon="faCopy"
          :title="title ?? t('common.actions.copy')"
          :color-class="iconColorClass"
          @click="copy"
        />
      </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import IconButton from '@/components/core/buttons/IconButton.vue';
import { useNotificationStore } from '@/store/ui/notifications';

/**
 * A copyable value: monospace display next to a copy button that writes the
 * value to the clipboard and toasts the outcome (including clipboard-API
 * rejections, e.g. missing permission or an insecure context).
 */
const props = withDefaults(
  defineProps<{
    /** The text shown and copied. */
    value: string;
    /** Optional small label rendered above the value. */
    label?: string;
    /** Tooltip of the copy button; defaults to the generic copy action. */
    title?: string;
    /** Render as a scrollable multi-line block instead of inline code. */
    multiline?: boolean;
    /** Tailwind classes of the value block, for surface/size variations. */
    valueClass?: string;
    /** Tailwind classes of the copy button. */
    iconColorClass?: string;
  }>(),
  {
    label: undefined,
    title: undefined,
    multiline: false,
    valueClass: 'text-xs font-mono text-text-primary bg-background-primary rounded px-2 py-1.5',
    iconColorClass: 'text-text-secondary hover:text-accent-primary',
  },
);

const { t } = useI18n();
const notifications = useNotificationStore();

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value);
    notifications.show(t('common.states.copied'), 'success');
  } catch {
    notifications.show(t('errors.unknown_error'), 'error');
  }
}
</script>

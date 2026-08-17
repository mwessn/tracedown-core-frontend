<template>
    <div class="flex items-center gap-2 py-1.5 border-b border-text-secondary/25 last:border-b-0 text-sm">
      <slot />
      <AppSelect
        v-model="level"
        class="w-24 ml-auto shrink-0"
        :options="levelOptions"
      />
      <IconButton
        :fa-icon="faTrash"
        :title="removeTitle ?? t('common.actions.delete')"
        color-class="text-text-secondary hover:text-status-failure"
        :hold-offset-sec="3"
        @safe-click="emit('remove')"
      />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import AppSelect from '@/components/core/input/AppSelect.vue';
import IconButton from '@/components/core/buttons/IconButton.vue';
import type { SelectOption } from '@/types/ui/common';

/**
 * One access/grant row: caller-provided leading content (badge, name, email),
 * a read/write level select and a remove button. The level is command-style —
 * a set emits `set-level` and the row re-renders from the server-confirmed
 * value.
 */
const props = defineProps<{
  /** Current permission level (1 = read, 2 = write). */
  permissions: number;
  /** Tooltip of the remove button; defaults to the generic delete action. */
  removeTitle?: string;
}>();

const emit = defineEmits<{
  'set-level': [level: number];
  remove: [];
}>();

const { t } = useI18n();

const level = computed({
  get: () => String(props.permissions),
  set: (value: string) => emit('set-level', Number(value)),
});

const levelOptions = computed<SelectOption[]>(() => [
  { value: '1', label: t('permissions.read') },
  { value: '2', label: t('permissions.write') },
]);
</script>

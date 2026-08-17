<template>
    <tr class="border-b border-text-secondary/25">
      <td class="py-2.5 px-3 text-sm font-mono">
        <span class="inline-flex items-center gap-1.5">
          <FontAwesomeIcon
            :icon="faLock"
            class="w-3 h-3 text-text-secondary"
            :title="t('variables.lockedVariable')"
          />
          <span><span class="text-text-secondary">{{ resourcePrefix }}</span><span class="text-text-primary">{{ locked.key }}</span></span>
        </span>
      </td>
      <td class="py-2.5 px-3 text-sm">
        <span
          class="font-mono text-text-secondary text-xs truncate block max-w-xs"
          :title="locked.description"
        >{{ locked.value || t('variables.lockedComputed') }}</span>
      </td>
      <td class="py-2.5 px-3">
        <BadgePill
          color-class="bg-text-secondary/30 text-text-secondary"
          :label="t('variables.typeLocked')"
        />
      </td>
      <td
        v-if="showActions"
        class="w-20"
      />
    </tr>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import BadgePill from '@/components/core/BadgePill.vue';
import type { LockedVariable } from '@/data/variables/VariableDto';

/**
 * A read-only, platform-computed variable (e.g. `$s.name`). Never editable —
 * the resolver injects its value on every run. `showActions` keeps the column
 * count aligned with editable rows in the same table.
 */
defineProps<{
  locked: LockedVariable;
  resourcePrefix: string;
  showActions: boolean;
}>();

const { t } = useI18n();
</script>

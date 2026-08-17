<template>
    <div
      class="text-center"
      :class="compact ? 'py-4' : 'py-12'"
    >
      <p
        class="text-text-secondary"
        :class="compact ? 'text-xs' : 'text-sm'"
      >
        {{ t('common.states.loading') }}
      </p>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

/** Centered in-flow loading text for list/detail areas. */
withDefaults(
  defineProps<{
    compact?: boolean;
  }>(),
  {
    compact: false,
  }
);

const { t } = useI18n();
</script>

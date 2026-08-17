<template>
    <component
      :is="interactive ? 'button' : 'span'"
      :type="interactive ? 'button' : undefined"
      class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
      :class="[colorClass, interactive ? 'transition-colors' : '']"
      :title="title"
      @click="interactive && emit('click')"
    >
      {{ label }}
      <FontAwesomeIcon
        v-if="faIcon"
        :icon="faIcon"
        class="w-3 h-3"
      />
    </component>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/**
 * Compact pill/badge: status markers, type tags, group chips. `interactive`
 * renders a button (hover styles belong in `colorClass`).
 */
withDefaults(
  defineProps<{
    label: string;
    colorClass?: string;
    faIcon?: IconDefinition | null;
    interactive?: boolean;
    title?: string;
  }>(),
  {
    colorClass: 'bg-text-primary/10 text-text-primary',
    faIcon: null,
    interactive: false,
    title: undefined,
  }
);

const emit = defineEmits<{
  click: [];
}>();
</script>

<template>
    <button
      type="button"
      class="inline-flex items-center gap-1.5 font-medium transition-colors"
      :class="[colorClass, sizeClass]"
      @click="emit('click')"
    >
      <FontAwesomeIcon
        v-if="faIcon"
        :icon="faIcon"
        class="w-3 h-3"
      />
      {{ labelText }}
    </button>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/**
 * Inline text-link style button (reveal, view body, copy, …).
 *
 * Listen with `@click` — NOT `:on-click`. The TDButton presets take an
 * `onClick` prop, but this component emits; an undeclared kebab-case
 * `:on-click` binding is never camelized into a listener and dies silently
 * as a DOM attribute.
 */
withDefaults(
  defineProps<{
    labelText: string;
    faIcon?: IconDefinition;
    colorClass?: string;
    sizeClass?: string;
  }>(),
  {
    faIcon: undefined,
    colorClass: 'text-accent-primary hover:text-accent-primary/80',
    sizeClass: 'text-xs',
  }
);

const emit = defineEmits<{
  click: [];
}>();
</script>

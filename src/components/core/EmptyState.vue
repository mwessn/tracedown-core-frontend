<template>
    <div
      class="text-center"
      :class="compact ? 'py-4' : 'py-12'"
    >
      <FontAwesomeIcon
        v-if="icon"
        :icon="icon"
        class="w-8 h-8 text-text-secondary mb-3"
      />
      <p
        class="text-text-secondary"
        :class="compact ? 'text-xs' : ''"
      >
        {{ message }}
      </p>
      <p
        v-if="description"
        class="text-sm text-text-secondary mt-1"
      >
        {{ description }}
      </p>
      <slot />
    </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

withDefaults(
  defineProps<{
    icon?: IconDefinition | null;
    message: string;
    description?: string;
    compact?: boolean;
  }>(),
  {
    icon: null,
    description: undefined,
    compact: false,
  }
);
</script>

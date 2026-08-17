<template>
    <div class="rounded border border-text-secondary/20 bg-background-secondary/40 p-4">
      <div class="flex items-center gap-2 text-text-secondary text-xs uppercase tracking-wider">
        <FontAwesomeIcon
          :icon="faIcon"
          class="w-3.5 h-3.5"
        />
        <span>{{ label }}</span>
      </div>
      <p class="mt-2 text-2xl font-semibold text-text-primary tabular-nums">
        {{ value }}
      </p>
    </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/** One usage metric tile: an icon, an uppercase label, and a large value. */
defineProps<{
  faIcon: IconDefinition;
  label: string;
  value: string;
}>();
</script>

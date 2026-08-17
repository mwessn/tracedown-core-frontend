<template>
    <div class="relative group inline-flex">
      <FontAwesomeIcon :icon="faCircleQuestion" class="w-3 h-3 text-text-secondary cursor-help" />
      <div
        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 hidden group-hover:block z-50
             bg-background-secondary border border-text-secondary/50 rounded-lg shadow-xl
             text-xs text-text-secondary"
      >
        <p
          v-for="(entry, i) in entries"
          :key="entry.term"
          :class="i < entries.length - 1 ? 'mb-2' : ''"
        >
          <span class="font-medium text-text-primary">{{ entry.term }}</span> — {{ entry.description }}
        </p>
      </div>
    </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import type { HelpEntry } from '@/types/ui/help';

/** Hover "?" glossary tooltip: each entry renders as `term — description`. */
defineProps<{
  entries: HelpEntry[];
}>();
</script>

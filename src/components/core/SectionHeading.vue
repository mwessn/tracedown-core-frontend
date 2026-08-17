<template>
    <h4
      class="text-xs font-medium uppercase tracking-wider"
      :class="colorClass"
    >
      {{ label }}
    </h4>
</template>

<script setup lang="ts">
/** Uppercase micro-heading of a content section. Margins via class fallthrough. */
withDefaults(
  defineProps<{
    label: string;
    colorClass?: string;
  }>(),
  {
    colorClass: 'text-text-secondary',
  }
);
</script>

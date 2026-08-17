<template>
    <span
      class="border-accent-primary border-b-transparent rounded-full inline-block animate-spin"
      :class="sizeClass"
    />
</template>

<script setup lang="ts">
/** CSS-only spinner for localized loading states (charts, panels, …). */
withDefaults(
  defineProps<{
    sizeClass?: string;
  }>(),
  {
    sizeClass: 'w-10 h-10 border-4',
  }
);
</script>

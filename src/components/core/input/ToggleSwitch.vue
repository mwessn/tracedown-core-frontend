<template>
    <button
      type="button"
      class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors
           disabled:opacity-50 disabled:cursor-not-allowed"
      :class="model ? 'bg-accent-primary' : 'bg-text-secondary/50'"
      :disabled="disabled"
      @click="model = !model"
    >
      <span
        class="inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform"
        :class="model ? 'translate-x-4' : 'translate-x-0.5'"
      />
    </button>
</template>

<script setup lang="ts">
defineProps<{
  disabled?: boolean;
}>();

const model = defineModel<boolean>({ required: true });
</script>

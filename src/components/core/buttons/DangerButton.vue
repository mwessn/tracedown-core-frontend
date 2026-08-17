<template>
    <TDButton
      v-bind="props"
      button-color="status-failure"
      border-color="status-failure"
      text-color="background-secondary"
      @safe-click="emit('safeClick')"
    />
</template>

<script setup lang="ts">
import TDButton from '@/components/core/buttons/TDButton.vue';
import type { ButtonPresetProps } from '@/types/ui/buttons';

const props = defineProps<ButtonPresetProps>();
const emit = defineEmits<{ safeClick: [] }>();
</script>

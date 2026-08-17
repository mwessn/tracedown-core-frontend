<template>
    <TDButton
      v-bind="props"
      button-color="#00000000"
      border-color="#00000000"
      text-color="text-secondary"
      @safe-click="emit('safeClick')"
    />
</template>

<script setup lang="ts">
import TDButton from '@/components/core/buttons/TDButton.vue';
import type { ButtonPresetProps } from '@/types/ui/buttons';

const props = defineProps<ButtonPresetProps>();
const emit = defineEmits<{ safeClick: [] }>();
</script>

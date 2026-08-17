<template>
    <component
      :is="component"
      v-for="(component, index) in components"
      :key="index"
      v-bind="slotProps"
    />
</template>

<script setup lang="ts">
import { type Component } from 'vue';
import { getSlotComponents } from '@/config/extensions';

/**
 * Renders every component registered for the named slot, forwarding
 * `slotProps` to each via `v-bind`. Renders nothing when none are registered.
 * The registry is populated once at startup (before mount), so the lookup is
 * a plain, non-reactive read.
 */
const props = defineProps<{
  name: string;
  slotProps?: Record<string, unknown>;
}>();

const components: Component[] = getSlotComponents(props.name);
</script>

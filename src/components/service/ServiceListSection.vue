<template>
    <div>
      <button
        class="w-full flex items-center gap-2 px-4 py-2.5 select-none"
        @click="emit('toggle')"
      >
        <FontAwesomeIcon
          :icon="faChevronRight"
          class="w-2.5 h-2.5 transition-transform"
          :class="[colorClass, collapsed ? '' : 'rotate-90']"
        />
        <SectionHeading
          :color-class="colorClass"
          :label="label"
        />
        <span
          class="text-xs font-medium rounded-full px-2 py-0.5"
          :class="[colorClass, pillClass]"
        >
          {{ count }}
        </span>
      </button>
      <div v-if="!collapsed">
        <slot />
      </div>
    </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import SectionHeading from '@/components/core/SectionHeading.vue';

/** Collapsible header of one service-list bucket (new / failing / healthy). */
defineProps<{
  label: string;
  count: number;
  colorClass: string;
  pillClass: string;
  collapsed: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

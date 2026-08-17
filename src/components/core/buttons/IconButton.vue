<template>
    <button
      type="button"
      class="relative p-1.5 rounded transition-colors select-none
        disabled:opacity-30 disabled:cursor-not-allowed"
      :class="colorClass"
      :disabled="disabled || (holdOffsetSec != null && !waitAfterRender)"
      :title="title"
      @click="handleClick"
      @mousedown.left="startHold"
      @mouseup.left="cancelHold"
      @mouseleave="cancelHold"
    >
      <FontAwesomeIcon
        :icon="faIcon"
        :class="iconClass"
      />

      <!-- Hold-to-confirm overlay: the same radial gesture the primary button
           uses, scaled for the icon surface. Only ever shown while holding. -->
      <span
        v-if="holdOffsetSec != null && isHolding"
        class="absolute inset-0 flex items-center justify-center bg-black/40 rounded"
      >
        <svg class="w-5 h-5 -rotate-90">
          <circle
            class="text-white/20"
            stroke="currentColor"
            stroke-width="2.5"
            fill="transparent"
            r="8"
            cx="10"
            cy="10"
          />
          <circle
            class="text-white"
            stroke="currentColor"
            stroke-width="2.5"
            fill="transparent"
            r="8"
            cx="10"
            cy="10"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            stroke-linecap="round"
          />
        </svg>
      </span>
    </button>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/**
 * Icon-only action button (close, edit, pagination, …). Pass `holdOffsetSec`
 * to gate a destructive action behind a press-and-hold: a plain click then
 * does nothing and the action fires via `safe-click` only after the hold
 * completes — mirroring the primary DangerButton hold gesture.
 */
const props = withDefaults(
  defineProps<{
    faIcon: IconDefinition;
    title?: string;
    disabled?: boolean;
    /** Text/hover treatment; override for colored actions (danger, play/pause…). */
    colorClass?: string;
    iconClass?: string;
    /** When set, the action is hold-to-confirm and only fires via `safe-click`. */
    holdOffsetSec?: number;
  }>(),
  {
    title: undefined,
    disabled: false,
    colorClass: 'text-text-secondary hover:text-text-primary hover:bg-background-primary',
    iconClass: 'w-3.5 h-3.5',
    holdOffsetSec: undefined,
  }
);

// The native event is forwarded so listener modifiers (`@click.stop` on
// rows with their own click targets) have something to call stopPropagation
// on — a bare emit made `.stop` throw and silently drop the handler.
const emit = defineEmits<{
  click: [event: MouseEvent];
  safeClick: [];
}>();

// A hold-gated button only fires through the completed hold. A plain click is
// swallowed (and its propagation stopped, so a click inside a clickable row
// never triggers the row) — the same click/hold split the primary button uses.
function handleClick(event: MouseEvent) {
  if (props.holdOffsetSec != null) {
    event.stopPropagation();
    return;
  }
  emit('click', event);
}

const holdTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const interval = ref<ReturnType<typeof setInterval> | null>(null);
const isHolding = ref<boolean>(false);
const elapsed = ref<number>(0);

const radius = 8;
const circumference = 2 * Math.PI * radius;

const strokeDashoffset = computed(() => {
  const progress = Math.min(elapsed.value / ((props.holdOffsetSec ?? 0) * 1000), 1);
  return circumference * (1 - progress);
});

function startHold() {
  if (props.disabled || props.holdOffsetSec == null) return;
  isHolding.value = true;
  elapsed.value = 0;

  holdTimeout.value = setTimeout(
    () => {
      emit('safeClick');
      cancelHold();
    },
    props.holdOffsetSec * 1000
  );

  interval.value = setInterval(() => {
    elapsed.value += 100;
  }, 100);
}

function cancelHold() {
  if (holdTimeout.value) clearTimeout(holdTimeout.value);
  if (interval.value) clearInterval(interval.value);
  holdTimeout.value = null;
  interval.value = null;
  isHolding.value = false;
  elapsed.value = 0;
}

// Mirrors the primary button: stay disabled until the first render settles so
// a stray pointer event can't complete a zero-length hold on mount.
const waitAfterRender = ref<boolean>(false);
onMounted(async () => {
  await nextTick();
  waitAfterRender.value = true;
});

onBeforeUnmount(() => cancelHold());
</script>

<template>
    <div
      ref="root"
      class="relative"
    >
      <slot
        name="trigger"
        :open="open"
        :toggle="toggle"
      />
      <div
        v-if="open"
        class="absolute top-full mt-1 py-1 z-50
             bg-background-secondary border border-text-secondary/50 rounded-lg shadow-xl"
        :class="[alignRight ? 'right-0' : 'left-0', panelClass]"
      >
        <slot :close="close" />
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

/**
 * Generic dropdown shell: a trigger slot toggles an anchored panel, and any
 * click outside the component closes it. Used by selects and the header menus.
 */
withDefaults(
  defineProps<{
    alignRight?: boolean;
    panelClass?: string;
  }>(),
  {
    alignRight: false,
    panelClass: 'w-56',
  }
);

const emit = defineEmits<{
  /** Fired whenever the panel closes (select, toggle, or outside click). */
  closed: [];
}>();

const root = ref<HTMLElement | null>(null);
const open = ref<boolean>(false);

function toggle() {
  open.value = !open.value;
  if (!open.value) emit('closed');
}

function close() {
  open.value = false;
  emit('closed');
}

/**
 * Containment is tested on `pointerdown`, not `click`: a handler inside the panel
 * may re-render and detach the very element that was clicked (a button that swaps
 * itself for an input, say) before the click bubbles up here — `contains()` would
 * then report false for the detached target and close the panel spuriously. At
 * pointerdown time the DOM is still untouched, so the check is accurate and
 * in-panel controls need no `@click.stop`.
 */
function handlePressOutside(e: PointerEvent) {
  if (open.value && root.value && !root.value.contains(e.target as Node)) {
    open.value = false;
    emit('closed');
  }
}

onMounted(() => document.addEventListener('pointerdown', handlePressOutside));
onUnmounted(() => document.removeEventListener('pointerdown', handlePressOutside));
</script>

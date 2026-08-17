<template>
    <div class="flex gap-2 justify-between">
      <input
        v-for="i in length"
        :key="i"
        :ref="(el) => setBoxRef(i - 1, el)"
        :value="model[i - 1] ?? ''"
        type="text"
        inputmode="numeric"
        maxlength="1"
        autocomplete="one-time-code"
        class="w-10 h-12 text-center text-lg font-mono rounded-lg
             bg-background-primary border border-text-secondary/50 text-text-primary
             focus:outline-none focus:border-accent-primary transition-colors
             disabled:opacity-50"
        :disabled="disabled"
        @input="onInput(i - 1, $event)"
        @keydown.backspace="onBackspace(i - 1, $event)"
        @paste.prevent="onPaste($event)"
      >
    </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import type { ComponentPublicInstance } from 'vue';

/**
 * Segmented one-time-code input: one box per digit, auto-advance, backspace
 * steps back, paste distributes. Emits `complete` once every box is filled.
 */
const props = withDefaults(
  defineProps<{
    length?: number;
    disabled?: boolean;
    autofocus?: boolean;
  }>(),
  {
    length: 6,
    disabled: false,
    autofocus: false,
  }
);

const model = defineModel<string>({ required: true });

const emit = defineEmits<{
  complete: [code: string];
}>();

const boxes: (HTMLInputElement | null)[] = [];

function setBoxRef(index: number, el: Element | ComponentPublicInstance | null) {
  boxes[index] = el as HTMLInputElement | null;
}

function update(next: string) {
  const value = next.slice(0, props.length);
  model.value = value;
  if (value.length === props.length) {
    emit('complete', value);
  }
}

function onInput(index: number, event: Event) {
  const box = event.target as HTMLInputElement;
  const digit = box.value.replace(/\D/g, '').slice(-1);
  box.value = digit;

  const chars = model.value.padEnd(props.length, ' ').split('');
  chars[index] = digit || ' ';
  update(chars.join('').trimEnd().replace(/ /g, ''));

  if (digit && index < props.length - 1) {
    boxes[index + 1]?.focus();
  }
}

function onBackspace(index: number, event: KeyboardEvent) {
  const box = event.target as HTMLInputElement;
  if (box.value === '' && index > 0) {
    event.preventDefault();
    boxes[index - 1]?.focus();
    update(model.value.slice(0, index - 1));
  } else {
    update(model.value.slice(0, index));
  }
}

function onPaste(event: ClipboardEvent) {
  const pasted = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, props.length);
  if (!pasted) return;
  update(pasted);
  boxes[Math.min(pasted.length, props.length - 1)]?.focus();
}

onMounted(() => {
  if (props.autofocus) boxes[0]?.focus();
});
</script>

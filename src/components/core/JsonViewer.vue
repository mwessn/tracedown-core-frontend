<template>
    <div class="overflow-hidden border border-text-secondary/50">
      <Codemirror
        :model-value="formatted"
        :extensions="extensions"
        disabled
        class="text-xs"
      />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { json } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';

/** Read-only CodeMirror JSON viewer (raw results, headers, …). */
const props = defineProps<{
  data: unknown;
  maxHeight?: string;
}>();

const formatted = computed(() => JSON.stringify(props.data, null, 2));

const sizeTheme = computed(() =>
  EditorView.theme({
    '&': { maxHeight: props.maxHeight ?? '20rem' },
    '.cm-scroller': { overflow: 'auto' },
  }));

const extensions = computed(() => [
  json(),
  oneDark,
  sizeTheme.value,
  EditorView.lineWrapping,
  EditorView.editable.of(false),
]);
</script>

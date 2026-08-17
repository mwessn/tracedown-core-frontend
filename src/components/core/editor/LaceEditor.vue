<template>
    <div>
      <div class="overflow-hidden border border-text-secondary/50">
        <Codemirror
          v-model="model"
          :extensions="extensions"
          :disabled="readonly"
          class="text-sm"
        />
      </div>
      <p
        v-if="collab && collab.peers.value.length > 0"
        class="mt-1 text-xs text-accent-primary"
      >
        {{ t('editor.othersEditing', { names: collab.peers.value.join(', ') }) }}
      </p>
    </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Codemirror } from 'vue-codemirror';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';
import { laceLanguage, laceLinter, laceSaveKeymap } from '@/lib/lace-codemirror';
import { useScriptCollab } from '@/composables/useScriptCollab';

const props = defineProps<{
  readonly?: boolean;
  minHeight?: string;
  maxHeight?: string;
  /** Used to name the file when Ctrl/Cmd+S downloads the script (`<snake_case>.lace`). */
  serviceName?: string;
  /** Service id — enables live collaborative editing on `svc-edit:{id}` when set. */
  collabId?: string;
}>();

const model = defineModel<string>({ required: true });

const emit = defineEmits<{
  'validate': [errorCount: number];
}>();

const { t } = useI18n();

// Collaborative editing: active only for an editable editor bound to a service.
// Guards a re-broadcast loop — applying a remote edit sets `model`, which must
// not be echoed back out as if the local user typed it.
let applyingRemote = false;
const collab = props.collabId && !props.readonly
  ? useScriptCollab({
    channelId: () => props.collabId,
    getText: () => model.value,
    applyRemote: (text: string) => {
      if (text === model.value) return;
      applyingRemote = true;
      model.value = text;
    },
  })
  : null;

watch(model, () => {
  if (applyingRemote) { applyingRemote = false; return; }
  collab?.pushLocal();
});

const heightTheme = computed(() =>
  EditorView.theme({
    '&': { minHeight: props.minHeight ?? '12rem', ...(props.maxHeight ? { maxHeight: props.maxHeight } : {}) },
    '.cm-scroller': { overflow: 'auto' },
    '.cm-content': { minHeight: props.minHeight ?? '12rem' },
  }));

// Broadcast presence on focus (the user is actively editing) and stand down on blur.
const collabFocus = EditorView.domEventHandlers({
  focus: () => { collab?.focus(); return false; },
  blur: () => { collab?.blur(); return false; },
});

const extensions = computed(() => [
  laceLanguage(),
  oneDark,
  heightTheme.value,
  EditorView.lineWrapping,
  // Ctrl/Cmd+S downloads the script as <snake_case>.lace rather than the page.
  laceSaveKeymap(() => props.serviceName),
  ...(collab ? [collabFocus] : []),
  ...(props.readonly
    ? [EditorView.editable.of(false)]
    : [laceLinter((count) => emit('validate', count))]
  ),
]);
</script>

<template>
    <div
      ref="root"
      class="relative"
    >
      <TextInput
        v-model="input"
        class="w-full"
        autocomplete="off"
        name="search"
        :placeholder="t('common.actions.search')"
        @keydown.escape="clearResults"
      />

      <!-- Global results (only populated when the provider returns any) -->
      <div
        v-if="results.length"
        class="absolute top-full mt-1 w-full py-1 z-50 max-h-96 overflow-y-auto
             bg-background-secondary border border-text-secondary/50 rounded-lg shadow-xl"
      >
        <button
          v-for="result in results"
          :key="result.id"
          class="w-full px-3 py-2 text-left transition-colors hover:bg-background-primary/50"
          @click="open(result)"
        >
          <span class="block text-sm text-text-primary truncate">{{ result.label }}</span>
          <span
            v-if="result.sublabel"
            class="block text-xs text-text-secondary truncate"
          >{{ result.sublabel }}</span>
        </button>
      </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useSearchStore } from '@/store/ui/search';
import { getSearchProvider } from '@/config/search';
import TextInput from "@/components/core/input/TextInput.vue";
import type { SearchResult } from '@/types/ui/common';

const props = withDefaults(defineProps<{
  debounceMs?: number;
}>(), {
  debounceMs: 250,
});

const { t } = useI18n();
const router = useRouter();
const search = useSearchStore();

const root = ref<HTMLElement | null>(null);

// Live input value — bind this with v-model in the template. It is only pushed
// to the store (search.commit) after the debounce window elapses, so views are
// not hit on every keystroke.
const input = ref<string>('');

// Global provider results. The default provider always resolves to null,
// leaving this empty; the committed value still drives the view-local filter.
const results = ref<SearchResult[]>([]);
let querySeq = 0;

let timer: ReturnType<typeof setTimeout> | null = null;

function clearTimer() {
  if (timer !== null) {
    clearTimeout(timer);
    timer = null;
  }
}

function commit(value: string) {
  search.commit(value);
  void queryProvider(value);
}

async function queryProvider(value: string) {
  const seq = ++querySeq;
  if (!value.trim()) {
    results.value = [];
    return;
  }
  const found = await getSearchProvider().search(value);
  if (seq !== querySeq) return; // a newer query superseded this one
  results.value = found ?? [];
}

function clearResults() {
  querySeq++;
  results.value = [];
}

function open(result: SearchResult) {
  clearResults();
  if (result.to) {
    void router.push(result.to);
  }
}

function handleClickOutside(e: MouseEvent) {
  if (results.value.length && root.value && !root.value.contains(e.target as Node)) {
    clearResults();
  }
}

watch(input, (value) => {
  clearTimer();

  // Clearing the field commits immediately so results disappear without lag.
  if (value === '') {
    commit('');
    return;
  }

  timer = setTimeout(() => {
    timer = null;
    commit(value);
  }, props.debounceMs);
});

onMounted(() => {
  search.setActive(true);
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  clearTimer();
  search.setActive(false);
  document.removeEventListener('click', handleClickOutside);
});
</script>

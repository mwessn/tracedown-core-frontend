<template>
    <div>
      <SectionHeading
        v-if="title"
        class="mb-2"
        :label="title"
      />

      <div class="border border-text-secondary/25">
        <!-- Header: search + available items (first N; the rest via search) -->
        <div class="bg-background-primary p-3 border-b border-text-secondary/25 space-y-2">
          <TextInput
            v-if="available.length > visibleCount || search"
            v-model="search"
            compact
            :placeholder="searchPlaceholder"
          />
          <div
            v-if="visibleAvailable.length > 0"
            class="flex flex-wrap gap-2"
          >
            <BadgePill
              v-for="item in visibleAvailable"
              :key="item.id"
              interactive
              color-class="bg-text-primary/10 text-text-primary hover:bg-accent-primary/15 hover:text-accent-primary"
              :fa-icon="faPlus"
              :label="item.label"
              :title="addTitle"
              @click="emit('add', item.id)"
            />
          </div>
          <p
            v-else
            class="text-xs text-text-secondary italic"
          >
            {{ search ? t('common.states.noMatches') : allAssignedText }}
          </p>
          <p
            v-if="hiddenCount > 0"
            class="text-xs text-text-secondary"
          >
            {{ t('common.states.moreMatches', { n: hiddenCount }) }}
          </p>
        </div>

        <!-- Body: the assigned items (slot for richer layouts, pills by default) -->
        <div class="p-3">
          <template v-if="assigned.length > 0">
            <slot name="assigned">
              <div class="flex flex-wrap gap-2">
                <BadgePill
                  v-for="item in assigned"
                  :key="item.id"
                  interactive
                  color-class="bg-accent-primary/10 text-accent-primary hover:bg-status-failure/15 hover:text-status-failure"
                  :fa-icon="faXmark"
                  :label="item.label"
                  :title="removeTitle"
                  @click="emit('remove', item.id)"
                />
              </div>
            </slot>
          </template>
          <p
            v-else
            class="text-xs text-text-secondary italic"
          >
            {{ noneAssignedText }}
          </p>
        </div>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import TextInput from '@/components/core/input/TextInput.vue';
import BadgePill from '@/components/core/BadgePill.vue';
import SectionHeading from '@/components/core/SectionHeading.vue';
import type { PillItem } from '@/types/ui/common';

/**
 * Header/body assignment card: the header offers available items as `+`
 * pills (first N; the rest narrowed by client-side search), the body shows
 * the assigned ones as `×` pills — or whatever the `assigned` slot renders.
 */
const props = withDefaults(
  defineProps<{
    available: PillItem[];
    assigned: PillItem[];
    title?: string;
    searchPlaceholder?: string;
    addTitle?: string;
    removeTitle?: string;
    allAssignedText: string;
    noneAssignedText: string;
    visibleCount?: number;
  }>(),
  {
    title: undefined,
    searchPlaceholder: undefined,
    addTitle: undefined,
    removeTitle: undefined,
    visibleCount: 5,
  }
);

const emit = defineEmits<{
  add: [id: string];
  remove: [id: string];
}>();

const { t } = useI18n();

const search = ref<string>('');

const filtered = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) return props.available;
  return props.available.filter(item => item.label.toLowerCase().includes(term));
});

const visibleAvailable = computed(() => filtered.value.slice(0, props.visibleCount));
const hiddenCount = computed(() => filtered.value.length - visibleAvailable.value.length);
</script>

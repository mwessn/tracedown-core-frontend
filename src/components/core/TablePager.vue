<template>
    <div
      v-if="total > pageSize"
      class="flex items-center gap-3"
    >
      <IconButton
        :fa-icon="faChevronLeft"
        :title="t('common.actions.previous')"
        color-class="text-text-secondary hover:text-accent-primary"
        :disabled="page <= 1"
        @click="emit('change', page - 1)"
      />
      <span class="text-xs text-text-secondary tabular-nums">
        {{ t('common.states.pageRange', { from: rangeFrom, to: rangeTo, total }) }}
      </span>
      <IconButton
        :fa-icon="faChevronRight"
        :title="t('common.actions.next')"
        color-class="text-text-secondary hover:text-accent-primary"
        :disabled="rangeTo >= total"
        @click="emit('change', page + 1)"
      />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import IconButton from '@/components/core/buttons/IconButton.vue';

/** Prev/next pager for PFS tables. Hidden while everything fits one page. */
const props = defineProps<{
  page: number;
  pageSize: number;
  total: number;
}>();

const emit = defineEmits<{
  change: [page: number];
}>();

const { t } = useI18n();

const rangeFrom = computed(() => (props.page - 1) * props.pageSize + 1);
const rangeTo = computed(() => Math.min(props.page * props.pageSize, props.total));
</script>

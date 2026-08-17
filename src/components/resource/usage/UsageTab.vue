<template>
    <div class="px-gutter py-6 space-y-5">
      <SlotOutlet name="usage-header" :slot-props="{ scope, resourceId }" />
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <SectionHeading :label="t('usage.title')" />
          <p class="text-sm text-text-secondary mt-1 max-w-2xl">
            {{ t('usage.hint') }}
          </p>
        </div>
        <!-- Period selector -->
        <div class="inline-flex rounded border border-text-secondary/30 overflow-hidden">
          <button
            v-for="period in USAGE_PERIODS"
            :key="period.hours"
            type="button"
            class="px-3 py-1.5 text-sm transition-colors"
            :class="period.hours === selectedHours
              ? 'bg-accent-primary/20 text-accent-primary'
              : 'text-text-secondary hover:text-text-primary hover:bg-background-primary'"
            @click="selectHours(period.hours)"
          >
            {{ t(period.labelKey) }}
          </button>
        </div>
      </div>

      <LoadingState v-if="usageStore.loading && !usageStore.usage" />

      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl"
      >
        <UsageStat
          :fa-icon="faArrowRightArrowLeft"
          :label="t('usage.requests')"
          :value="formatCount(usageStore.usage?.requests ?? 0)"
        />
        <UsageStat
          :fa-icon="faArrowDown"
          :label="t('usage.ingress')"
          :value="formatBytes(usageStore.usage?.ingressBytes ?? 0)"
        />
        <UsageStat
          :fa-icon="faArrowUp"
          :label="t('usage.egress')"
          :value="formatBytes(usageStore.usage?.egressBytes ?? 0)"
        />
        <SlotOutlet name="usage-stats" :slot-props="{ scope, resourceId, usage: usageStore.usage }" />
      </div>

      <p
        v-if="cappedNotice"
        class="text-xs text-text-secondary"
      >
        {{ cappedNotice }}
      </p>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { faArrowDown, faArrowRightArrowLeft, faArrowUp } from '@fortawesome/free-solid-svg-icons';
import SectionHeading from '@/components/core/SectionHeading.vue';
import SlotOutlet from '@/components/core/SlotOutlet.vue';
import LoadingState from '@/components/core/LoadingState.vue';
import UsageStat from '@/components/resource/usage/UsageStat.vue';
import { useUsageStore } from '@/store/core/usage';
import { USAGE_PERIODS, type UsageScope } from '@/data/usage/UsageDto';
import { formatBytes, formatCount } from '@/lib/metrics-utils';

/**
 * Usage panel for a resource (or the whole org): total requests and measured
 * HTTP-layer ingress/egress over a selectable window. The server caps the
 * window to the shorter of the request, 7 days, and the retention period.
 */
const props = defineProps<{
  scope: UsageScope;
  /** Ignored for the org scope. */
  resourceId?: string;
}>();

const { t } = useI18n();
const usageStore = useUsageStore();

const selectedHours = ref<number>(24);

function selectHours(hours: number) {
  selectedHours.value = hours;
}

/** Shown when the server returned a smaller window than requested (retention cap). */
const cappedNotice = computed<string | null>(() => {
  const returned = usageStore.usage?.windowHours;
  if (returned == null || returned >= selectedHours.value) return null;
  return t('usage.capped', { hours: returned });
});

function load() {
  void usageStore.fetchUsage(props.scope, props.resourceId ?? '', selectedHours.value);
}

watch(selectedHours, load);
watch(() => props.resourceId, load);
onMounted(load);
</script>

<template>
    <div class="space-y-6">
      <div class="flex items-center justify-between gap-4">
        <h3 class="text-sm font-medium text-text-secondary">
          {{ t('statistics.title') }}
        </h3>
        <div class="w-40">
          <AppSelect
            v-model="window"
            :options="windowOptions"
          />
        </div>
      </div>

      <LoadingState v-if="loading" />

      <EmptyState
        v-else-if="!hasData"
        compact
        :icon="faChartLine"
        :message="t('statistics.empty')"
      />

      <template v-else>
        <!-- Headline figures over the selected window. -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div
            v-for="stat in summaryStats"
            :key="stat.label"
            class="border border-text-secondary/20 rounded-md p-3"
          >
            <div class="text-xs text-text-secondary">
              {{ stat.label }}
            </div>
            <div class="text-lg font-semibold text-text-primary">
              {{ stat.value }}
            </div>
          </div>
        </div>

        <section>
          <SectionHeading class="mb-2" :label="t('statistics.uptimeTrend')" />
          <StatSeriesChart
            mode="uptime"
            :buckets="overall"
            :bucket-type="stats!.bucketType"
          />
        </section>

        <section>
          <SectionHeading class="mb-2" :label="t('statistics.latencyTrend')" />
          <StatSeriesChart
            mode="latency"
            :buckets="overall"
            :bucket-type="stats!.bucketType"
          />
        </section>

        <section v-if="regionRows.length > 0">
          <SectionHeading class="mb-2" :label="t('statistics.byRegion')" />
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-text-secondary/50">
                <th :class="TH">
                  {{ t('statistics.region') }}
                </th>
                <th :class="TH">
                  {{ t('statistics.uptimePct') }}
                </th>
                <th :class="TH">
                  {{ t('statistics.p95') }}
                </th>
                <th :class="TH">
                  {{ t('statistics.probes') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in regionRows"
                :key="row.agentId"
                class="border-b border-text-secondary/25"
              >
                <td class="py-2 px-3 text-text-primary">
                  {{ row.agentLabel }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{ row.uptime }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{ row.p95 }}
                </td>
                <td class="py-2 px-3 text-text-secondary">
                  {{ row.probes }}
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import AppSelect from '@/components/core/input/AppSelect.vue';
import SectionHeading from '@/components/core/SectionHeading.vue';
import LoadingState from '@/components/core/LoadingState.vue';
import EmptyState from '@/components/core/EmptyState.vue';
import StatSeriesChart from '@/components/core/graphs/StatSeriesChart.vue';
import { useStatisticsStore, type StatWindow } from '@/store/core/statistics';
import { useNotificationStore } from '@/store/ui/notifications';
import { formatMs } from '@/lib/metrics-utils';
import type { ServiceSummary } from '@/data/services/ServiceDto';
import type { StatBucket } from '@/data/metrics/MetricsDto';
import type { SelectOption } from '@/types/ui/common';
import { storeToRefs } from 'pinia';

const TH = 'text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3';

const props = defineProps<{
  service: ServiceSummary;
}>();

const { t } = useI18n();
const store = useStatisticsStore();
const notifications = useNotificationStore();
const { stats, loading } = storeToRefs(store);

const window = ref<StatWindow>('24h');

const windowOptions = computed<SelectOption[]>(() => [
  { value: '24h', label: t('statistics.window24h') },
  { value: '7d', label: t('statistics.window7d') },
  { value: '30d', label: t('statistics.window30d') },
  { value: '90d', label: t('statistics.window90d') },
]);

const overall = computed<StatBucket[]>(() => stats.value?.overall ?? []);
const hasData = computed(() => overall.value.length > 0);

/** Probe-count-weighted average of a bucket field over a series (null when no runs). */
function weighted(buckets: StatBucket[], pick: (b: StatBucket) => number | null): number | null {
  let num = 0;
  let den = 0;
  for (const b of buckets) {
    const v = pick(b);
    if (v == null) continue;
    num += v * b.probeCount;
    den += b.probeCount;
  }
  return den > 0 ? num / den : null;
}

function pct(v: number | null): string {
  return v == null ? '—' : `${v.toFixed(2)}%`;
}
function ms(v: number | null): string {
  return v == null ? '—' : formatMs(v);
}

const summaryStats = computed(() => {
  const b = overall.value;
  const probes = b.reduce((sum, x) => sum + x.probeCount, 0);
  return [
    { label: t('statistics.avgUptime'), value: pct(weighted(b, x => x.uptimePct)) },
    { label: t('statistics.avgErrorRate'), value: pct(weighted(b, x => x.errorRatePct)) },
    { label: t('statistics.avgP95'), value: ms(weighted(b, x => x.p95Ms)) },
    { label: t('statistics.probes'), value: probes.toLocaleString() },
  ];
});

const regionRows = computed(() =>
  (stats.value?.regions ?? []).map(r => ({
    agentId: r.agentId,
    agentLabel: r.agentLabel,
    uptime: pct(weighted(r.buckets, x => x.uptimePct)),
    p95: ms(weighted(r.buckets, x => x.p95Ms)),
    probes: r.buckets.reduce((sum, x) => sum + x.probeCount, 0).toLocaleString(),
  })));

async function load() {
  const result = await store.fetchStatistics(props.service.id, window.value);
  if (!result.ok) {
    notifications.show(result.message ?? t('errors.unknown_error'), 'error');
  }
}

onMounted(load);
watch(window, load);
watch(() => props.service.id, load);
</script>

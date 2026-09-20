<template>
    <div class="space-y-2">
      <div class="flex justify-end">
        <div class="w-64 max-md:w-full">
          <AppSelect
            v-model="selected"
            searchable
            :options="options"
          />
        </div>
      </div>

      <ChartCanvas
        type="line"
        :data="chartData"
        :options="chartOptions"
        height="220px"
      />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import AppSelect from '@/components/core/input/AppSelect.vue';
import ChartCanvas from '@/components/core/graphs/ChartCanvas.vue';
import { cssVar, withAlpha } from '@/lib/charts';
import { formatBucketLabel, formatMs } from '@/lib/metrics-utils';
import { buildPhaseTrend } from '@/utils/endpointSeries';
import { endpointLabel, type PhaseKey } from '@/utils/endpointStats';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import type { EndpointSeriesPoint, ServiceEndpointSeries } from '@/data/metrics/MetricsDto';
import type { SelectOption } from '@/types/ui/common';

/**
 * Where the time goes, over time: DNS / Connect / TLS / TTFB / Transfer stacked
 * per bucket, for the whole service or for one endpoint.
 *
 * The phases panel beside it answers "which endpoint is slow"; this one answers
 * "since when, and in which phase".
 */
const props = defineProps<{
  series: ServiceEndpointSeries;
}>();

const { t } = useI18n();

/** The "whole service" option — `all` carries no key of its own. */
const ALL = '\u0000all';

const selected = ref<string>(ALL);

const options = computed<SelectOption[]>(() => [
  { value: ALL, label: t('statistics.allEndpoints') },
  ...props.series.endpoints.map(e => ({ value: e.key, label: endpointLabel(e), title: e.key })),
]);

// A window switch can retire the selected endpoint; fall back to the service
// rather than draw an empty chart under a label that no longer exists.
watch(options, (list) => {
  if (!list.some(o => o.value === selected.value)) selected.value = ALL;
});

const points = computed<EndpointSeriesPoint[]>(() => {
  if (selected.value === ALL) return props.series.all.points;
  return props.series.endpoints.find(e => e.key === selected.value)?.points ?? [];
});

const model = computed(() => buildPhaseTrend(props.series.buckets, points.value));

const phaseLabels = computed<Record<PhaseKey, string>>(() => ({
  dns: t('metrics.dns'),
  connect: t('metrics.connect'),
  tls: t('metrics.tls'),
  ttfb: t('metrics.ttfb'),
  transfer: t('metrics.transfer'),
}));

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.series.buckets.map(start => formatBucketLabel(start, props.series.bucketType)),
  datasets: model.value.map(s => ({
    label: phaseLabels.value[s.phase],
    data: s.values,
    borderColor: cssVar(s.colorVar),
    // The band, not the line, is what is read here — the stroke only separates
    // one phase from the next.
    backgroundColor: withAlpha(cssVar(s.colorVar), 'cc'),
    fill: true,
    pointRadius: 0,
    borderWidth: 1,
    tension: 0.3,
    // A bucket that timed no call is a hole in every band; bridging it would
    // invent a measurement that was never taken.
    spanGaps: false,
  })),
}));

const chartOptions = computed<ChartOptions<'line'>>(() => {
  const textColor = cssVar('--color-text-secondary');
  const gridColor = cssVar('--chart-grid');
  return {
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { ticks: { color: textColor, maxTicksLimit: 8 }, grid: { display: false } },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: { color: textColor, callback: value => formatMs(Number(value)) },
        grid: { color: gridColor },
      },
    },
    plugins: {
      legend: { labels: { color: textColor, boxWidth: 12, boxHeight: 12 } },
      tooltip: {
        callbacks: {
          label: (item: TooltipItem<'line'>) =>
            t('statistics.endpointPhaseValue', {
              phase: item.dataset.label ?? '',
              value: item.parsed.y == null ? '—' : formatMs(item.parsed.y),
            }),
        },
      },
    },
  };
});
</script>

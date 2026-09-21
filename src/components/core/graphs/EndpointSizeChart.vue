<template>
    <ChartCanvas
      type="line"
      :data="chartData"
      :options="chartOptions"
      :height="height"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ChartCanvas from '@/components/core/graphs/ChartCanvas.vue';
import { cssVar } from '@/lib/charts';
import { formatBucketLabel, formatBytes } from '@/lib/metrics-utils';
import { useViewport } from '@/composables/useViewport';
import { buildSizeTrend } from '@/utils/endpointSeries';
import { shortTemplate } from '@/utils/endpointStats';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import type { ServiceEndpointSeries } from '@/data/metrics/MetricsDto';

/**
 * Average response size per endpoint over the window — a body that has been
 * quietly growing for a week is invisible in a latency chart until it is not.
 *
 * The busiest endpoints are drawn; the rest are legend entries a click brings
 * in, which is how twenty endpoints fit in one chart.
 */
const props = defineProps<{
  series: ServiceEndpointSeries;
}>();

const { t } = useI18n();
const { isMobile } = useViewport();

const LABEL_CHARS_MOBILE = 20;
const LABEL_CHARS_DESKTOP = 40;

const PLOT_HEIGHT_PX = 220;
const LEGEND_ROW_PX = 22;
const LEGEND_PER_ROW_MOBILE = 2;
const LEGEND_PER_ROW_DESKTOP = 3;

const model = computed(() => buildSizeTrend(props.series));

/** Chart.js takes the legend out of the canvas, so the canvas grows with it. */
const height = computed(() => {
  const perRow = isMobile.value ? LEGEND_PER_ROW_MOBILE : LEGEND_PER_ROW_DESKTOP;
  const rows = Math.ceil(model.value.length / perRow);
  return `${PLOT_HEIGHT_PX + Math.max(0, rows - 1) * LEGEND_ROW_PX}px`;
});

const chartData = computed<ChartData<'line'>>(() => ({
  labels: props.series.buckets.map(start => formatBucketLabel(start, props.series.bucketType)),
  datasets: model.value.map(s => ({
    label: `${s.method} ${shortTemplate(s.template, isMobile.value ? LABEL_CHARS_MOBILE : LABEL_CHARS_DESKTOP)}`,
    data: s.values,
    borderColor: cssVar(s.colorVar),
    backgroundColor: cssVar(s.colorVar),
    pointRadius: 0,
    borderWidth: 1.5,
    tension: 0.3,
    // A bucket in which the endpoint was not called is a gap, not a zero.
    spanGaps: true,
    hidden: !s.visible,
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
        beginAtZero: true,
        // Bytes in the units a person reads them in — a raw 1 048 576 tick is
        // a number nobody converts in their head.
        ticks: { color: textColor, callback: value => formatBytes(Number(value)) },
        grid: { color: gridColor },
      },
    },
    plugins: {
      legend: {
        labels: { color: textColor, boxWidth: 12, boxHeight: 12, usePointStyle: true, pointStyle: 'line' },
      },
      tooltip: {
        callbacks: {
          label: (item: TooltipItem<'line'>) => {
            const row = model.value[item.datasetIndex];
            const value = item.parsed.y == null ? '—' : formatBytes(item.parsed.y);
            return `${row?.key ?? item.dataset.label}: ${t('statistics.endpointAvgSize', { value })}`;
          },
        },
      },
    },
  };
});
</script>

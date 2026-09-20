<template>
    <div class="space-y-2">
      <!--  A single-region service has nothing to split, so the switch is not
            drawn at all rather than offered as a control that redraws the same
            line under a different name.  -->
      <div
        v-if="canSplit"
        class="flex items-center justify-end gap-2"
      >
        <span class="text-xs text-text-secondary">{{ t('statistics.perRegion') }}</span>
        <ToggleSwitch v-model="perRegion" />
      </div>

      <StatSeriesChart
        v-if="!showRegions"
        mode="latency"
        :buckets="buckets"
        :bucket-type="bucketType"
      />
      <ChartCanvas
        v-else
        type="line"
        :data="chartData"
        :options="chartOptions"
        :height="regionHeight"
      />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ChartCanvas from '@/components/core/graphs/ChartCanvas.vue';
import StatSeriesChart from '@/components/core/graphs/StatSeriesChart.vue';
import ToggleSwitch from '@/components/core/input/ToggleSwitch.vue';
import { cssVar } from '@/lib/charts';
import { formatBucketLabel, formatMs } from '@/lib/metrics-utils';
import { useViewport } from '@/composables/useViewport';
import { buildRegionLatencyModel } from '@/utils/regionSeries';
import type { ChartData, ChartOptions, TooltipItem } from 'chart.js';
import type { RegionSeries, StatBucket } from '@/data/metrics/MetricsDto';

/**
 * Response time over the window, either as the overall percentile trend or
 * split one line per region.
 *
 * The split plots p95 alone — the percentile the region table reports and the
 * one the overall chart is read for. Three percentiles across eight regions
 * would be twenty-four lines on one 200px canvas.
 */
const props = defineProps<{
  buckets: StatBucket[];
  /** "hourly" | "daily" — drives the x-axis label format. */
  bucketType: string;
  regions: RegionSeries[];
}>();

const { t } = useI18n();
const { isMobile } = useViewport();

const canSplit = computed(() => props.regions.length > 1);

// Not persisted: the overall trend is what the section is for, and a toggle
// left on for one service would open every other service on a chart it was
// never asked for.
const perRegion = ref<boolean>(false);
watch(canSplit, (can) => { if (!can) perRegion.value = false; });

const showRegions = computed(() => canSplit.value && perRegion.value);

const model = computed(() => buildRegionLatencyModel(props.regions));

/** Plot height the overall chart uses, and one legend row's worth of pixels. */
const PLOT_HEIGHT_PX = 200;
const LEGEND_ROW_PX = 22;
/** Region names are long, so a legend row holds few of them — fewer on a phone. */
const LEGEND_PER_ROW_MOBILE = 2;
const LEGEND_PER_ROW_DESKTOP = 4;

/**
 * Chart.js takes the legend out of the canvas it is given, so a legend that
 * wraps onto five rows would eat the plot and clip its own last row. The canvas
 * grows by what the extra rows take instead.
 */
const regionHeight = computed(() => {
  const perRow = isMobile.value ? LEGEND_PER_ROW_MOBILE : LEGEND_PER_ROW_DESKTOP;
  const rows = Math.ceil(model.value.lines.length / perRow);
  return `${PLOT_HEIGHT_PX + Math.max(0, rows - 1) * LEGEND_ROW_PX}px`;
});

const chartData = computed<ChartData<'line'>>(() => ({
  labels: model.value.bucketStarts.map(start => formatBucketLabel(start, props.bucketType)),
  datasets: model.value.lines.map(line => ({
    label: line.agentLabel,
    data: line.values,
    borderColor: cssVar(line.colorVar),
    backgroundColor: cssVar(line.colorVar),
    pointRadius: 0,
    borderWidth: 1.5,
    tension: 0.3,
    // An agent that ran nothing for an hour has no bucket there; the line
    // bridges the gap instead of diving to zero.
    spanGaps: true,
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
        ticks: { color: textColor, callback: value => formatMs(Number(value)) },
        grid: { color: gridColor },
      },
    },
    plugins: {
      // Region names are long and there can be a dozen of them: the legend
      // wraps onto as many rows as it needs, and a click on an entry hides
      // that region's line — the only way to read a crowded chart.
      legend: {
        labels: {
          color: textColor,
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          pointStyle: 'line',
        },
      },
      tooltip: {
        callbacks: {
          label: (item: TooltipItem<'line'>) =>
            `${item.dataset.label}: ${item.parsed.y == null ? '—' : formatMs(item.parsed.y)}`,
        },
      },
    },
  };
});
</script>

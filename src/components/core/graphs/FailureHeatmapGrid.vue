<template>
    <div class="space-y-2">
      <!--  A 24-column grid cannot shrink below legibility, so the grid — not
            the page — takes the horizontal scroll on a phone.  -->
      <div class="w-full min-w-0 overflow-x-auto">
        <div class="min-w-[560px]">
          <div class="grid grid-cols-[2.5rem_repeat(24,minmax(0,1fr))] gap-px">
            <!-- Hour ruler: every third hour, so the labels never collide. -->
            <div />
            <div
              v-for="hour in HOURS"
              :key="`h${hour}`"
              class="text-[10px] text-text-secondary text-center"
            >
              {{ hour % 3 === 0 ? hourLabel(hour).slice(0, 2) : '' }}
            </div>

            <template
              v-for="(row, index) in grid.rows"
              :key="`w${index}`"
            >
              <div class="text-[10px] text-text-secondary self-center pr-1 truncate">
                {{ weekdays[index] }}
              </div>
              <div
                v-for="(cell, hour) in row"
                :key="`c${index}-${hour}`"
                class="h-4 max-md:h-3.5"
                :class="cell ? '' : 'bg-text-secondary/10'"
                :style="cell ? { backgroundColor: cellColor(cell.intensity) } : undefined"
                role="img"
                :title="cellLabel(index, hour, cell)"
                :aria-label="cellLabel(index, hour, cell)"
              />
            </template>
          </div>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-text-secondary">
        <span>{{ caption }}</span>
        <!--  The ramp runs to the worst cell in this grid, not to 100% — the
              legend says which number the dark end stands for.  -->
        <span class="flex items-center gap-1.5">
          <span class="inline-block h-2.5 w-2.5 bg-text-secondary/10" />
          {{ t('statistics.statusNone') }}
          <span class="ml-2">0%</span>
          <span
            v-for="step in RAMP_STEPS"
            :key="step"
            class="inline-block h-2.5 w-2.5"
            :style="{ backgroundColor: cellColor(step) }"
          />
          <span>{{ peakLabel }}</span>
        </span>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatCount } from '@/lib/metrics-utils';
import {
  buildHeatmapGrid,
  coveredDays,
  hourLabel,
  HOURS_PER_DAY,
  weekdayLabels,
  type HeatCell,
} from '@/utils/failureHeatmap';
import type { ServiceFailureHeatmap } from '@/data/metrics/MetricsDto';

/**
 * Failure rate by hour of the day and day of the week.
 *
 * The API extracts the grid in UTC and says so; nothing here shifts it into the
 * viewer's zone, because a whole-hour rotation is only exact until a DST change
 * falls inside the covered range — and a grid drawn over months always contains
 * one. The hour axis is labelled UTC instead.
 */
const props = defineProps<{
  heatmap: ServiceFailureHeatmap;
}>();

const { t, locale } = useI18n();

const HOURS = Array.from({ length: HOURS_PER_DAY }, (_, hour) => hour);
/** Swatches of the legend ramp, as positions along it. */
const RAMP_STEPS = [0.2, 0.4, 0.6, 0.8, 1];

/** Faintest tint a cell with runs still gets, so "no failures" is not "no runs". */
const MIN_TINT_PCT = 7;
const MAX_TINT_PCT = 82;

const grid = computed(() => buildHeatmapGrid(props.heatmap.cells));
const weekdays = computed(() => weekdayLabels(locale.value));

const days = computed(() => coveredDays(props.heatmap));

const caption = computed(() => {
  const covered = days.value;
  return covered == null
    ? t('statistics.heatmapCaptionEmpty', { timezone: props.heatmap.timezone })
    : t('statistics.heatmapCaption', { count: covered, timezone: props.heatmap.timezone }, covered);
});

const peakLabel = computed(() => `${grid.value.peakRatePct.toFixed(2)}%`);

/** One hue, light to dark — a magnitude, drawn in the colour failure already has. */
function cellColor(intensity: number): string {
  const pct = MIN_TINT_PCT + Math.max(0, Math.min(1, intensity)) * (MAX_TINT_PCT - MIN_TINT_PCT);
  return `color-mix(in srgb, var(--color-status-failure) ${pct.toFixed(1)}%, transparent)`;
}

/** Everything a cell has to say, for its tooltip and its label alike. */
function cellLabel(rowIndex: number, hour: number, cell: HeatCell | null): string {
  const when = t('statistics.heatmapCellWhen', {
    weekday: weekdays.value[rowIndex],
    hour: hourLabel(hour),
    timezone: props.heatmap.timezone,
  });
  if (!cell) return t('statistics.heatmapCellEmpty', { when });
  return t('statistics.heatmapCell', {
    when,
    runs: formatCount(cell.runs),
    failed: formatCount(cell.failedRuns),
    rate: cell.failureRatePct.toFixed(2),
  });
}
</script>

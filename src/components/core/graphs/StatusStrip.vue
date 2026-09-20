<template>
    <div class="space-y-2">
      <!--  The cells share the width and shrink with it, so the strip fits a
            390px screen at a day's worth of hourly buckets. Past that they stop
            at 3px and the strip — not the page — scrolls sideways.  -->
      <div
        class="flex items-stretch gap-px h-8 max-md:h-6 w-full min-w-0 overflow-x-auto"
        role="group"
        :aria-label="t('statistics.statusStrip')"
      >
        <div
          v-for="cell in cells"
          :key="cell.bucketStart"
          class="flex-1 min-w-[3px] shrink-0"
          :class="CELL_CLASSES[cell.status]"
          role="img"
          :title="cellLabel(cell)"
          :aria-label="cellLabel(cell)"
        />
      </div>

      <div class="flex items-center justify-between gap-2 text-xs text-text-secondary">
        <span>{{ edgeLabel(cells[0]) }}</span>
        <span>{{ edgeLabel(cells[cells.length - 1]) }}</span>
      </div>

      <!--  The colours are never the only carrier: every cell's tooltip and
            aria-label name its verdict in words, and this legend says what a
            colour means for a viewer who reads the strip at a glance.  -->
      <ul class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
        <li
          v-for="status in LEGEND_ORDER"
          :key="status"
          class="flex items-center gap-1.5"
        >
          <span
            class="inline-block h-2.5 w-2.5"
            :class="CELL_CLASSES[status]"
          />
          {{ statusLabels[status] }}
        </li>
      </ul>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatCount } from '@/lib/metrics-utils';
import { formatDate, formatShortDateTime, formatTime } from '@/lib/dateFormat';
import { buildStatusStrip, type BucketStatus, type StatusCell } from '@/utils/statusStrip';
import type { StatBucket } from '@/data/metrics/MetricsDto';

/**
 * Status-page strip: one cell per aggregate bucket across the selected window,
 * green while every run passed, amber once some failed, red once half of them
 * did, neutral where nothing ran.
 *
 * Plain elements rather than a canvas — a hundred one-pixel-wide rectangles
 * with a tooltip and a label each is exactly what the DOM is good at, and it
 * keeps the strip readable by a screen reader.
 */
const props = defineProps<{
  buckets: StatBucket[];
  /** "hourly" | "daily" — decides how long a cell's span is and how it is labelled. */
  bucketType: string;
}>();

const { t } = useI18n();

const CELL_CLASSES: Record<BucketStatus, string> = {
  ok: 'bg-status-success',
  degraded: 'bg-status-warning',
  down: 'bg-status-failure',
  none: 'bg-text-secondary/25',
};

/** Best to worst, with "nothing ran" last: it is not a degree of failure. */
const LEGEND_ORDER: readonly BucketStatus[] = ['ok', 'degraded', 'down', 'none'];

const cells = computed(() => buildStatusStrip(props.buckets, props.bucketType));

const statusLabels = computed<Record<BucketStatus, string>>(() => ({
  ok: t('statistics.statusOk'),
  degraded: t('statistics.statusDegraded'),
  down: t('statistics.statusDown'),
  none: t('statistics.statusNone'),
}));

/** `06.09. 13:00 – 14:00` for an hour, `06.09.2026` for a day. */
function rangeText(cell: StatusCell): string {
  if (props.bucketType === 'daily') return formatDate(cell.startMs);
  return `${formatShortDateTime(cell.startMs)}–${formatTime(cell.endMs)}`;
}

/** The whole of what a cell has to say, for both its tooltip and its label. */
function cellLabel(cell: StatusCell): string {
  const range = rangeText(cell);
  if (cell.uptimePct == null || cell.runs === 0) {
    return t('statistics.statusCellEmpty', { range, status: statusLabels.value.none });
  }
  return t('statistics.statusCellTooltip', {
    range,
    status: statusLabels.value[cell.status],
    runs: formatCount(cell.runs),
    failures: formatCount(cell.failures),
    uptime: cell.uptimePct.toFixed(2),
  });
}

/** The date under either end of the strip — the window's span, in two words. */
function edgeLabel(cell: StatusCell | undefined): string {
  return cell ? rangeText(cell) : '';
}
</script>

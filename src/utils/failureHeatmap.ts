/**
 * Model for the hour × weekday failure heatmap.
 *
 * The API returns sparse cells in **UTC** — ISO weekday 1..7, hour 0..23 — and
 * says so in its own `timezone` field. Nothing here shifts them: a whole-hour
 * rotation into the viewer's zone is only exact until a DST change falls inside
 * the covered range, and a grid drawn over months always contains one. The axis
 * is labelled UTC instead, which is true all year.
 */

import type { FailureHeatmapCell, ServiceFailureHeatmap } from '@/data/metrics/MetricsDto';

export const HOURS_PER_DAY = 24;
/** Rows, Monday first — the ISO weekday order the API already numbers by. */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

/** One drawn cell. A cell the API did not send had no runs and stays `null`. */
export interface HeatCell {
  weekday: number;
  hour: number;
  runs: number;
  failedRuns: number;
  /** 0..100. */
  failureRatePct: number;
  /** 0..1 against the grid's worst cell — the ramp position, not a rate. */
  intensity: number;
}

export interface HeatmapGrid {
  /** Seven rows of 24, Monday 00:00 UTC first. */
  rows: (HeatCell | null)[][];
  /** The worst cell's failure rate; 0 when nothing ever failed. */
  peakRatePct: number;
}

/**
 * The full 7 × 24 grid.
 *
 * The ramp is scaled to the grid's own worst cell, not to 100%: a service whose
 * worst hour is 0.8% would otherwise be one flat colour, and the point of the
 * panel is *which* hour is worse than the others. The tooltip always carries
 * the real numbers.
 */
export function buildHeatmapGrid(cells: readonly FailureHeatmapCell[]): HeatmapGrid {
  const byCell = new Map<string, FailureHeatmapCell>();
  for (const cell of cells) byCell.set(`${cell.weekday}:${cell.hour}`, cell);

  const rate = (cell: FailureHeatmapCell): number =>
    (cell.runs > 0 ? (cell.failedRuns / cell.runs) * 100 : 0);
  const peakRatePct = cells.reduce((max, cell) => Math.max(max, rate(cell)), 0);

  const rows = WEEKDAYS.map(weekday =>
    Array.from({ length: HOURS_PER_DAY }, (_, hour) => {
      const cell = byCell.get(`${weekday}:${hour}`);
      if (!cell || cell.runs <= 0) return null;
      const failureRatePct = rate(cell);
      return {
        weekday,
        hour,
        runs: cell.runs,
        failedRuns: cell.failedRuns,
        failureRatePct,
        intensity: peakRatePct > 0 ? failureRatePct / peakRatePct : 0,
      };
    }));

  return { rows, peakRatePct };
}

/**
 * Days the grid actually covers, from the hours that carried runs — so the
 * caption says what the data is, not what the request asked for. Null when the
 * service has no history at all.
 */
export function coveredDays(heatmap: ServiceFailureHeatmap): number | null {
  if (!heatmap.coveredFrom || !heatmap.coveredTo) return null;
  const from = Date.parse(heatmap.coveredFrom);
  const to = Date.parse(heatmap.coveredTo);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  // Both bounds are hours that hold data, so a single covered hour is one day.
  return Math.max(1, Math.round((to - from) / 86_400_000));
}

/**
 * Weekday names in the viewer's locale, Monday first.
 *
 * A fixed reference week (2024-01-01 was a Monday) read in UTC, so the names
 * line up with the ISO numbering whatever the viewer's own zone does.
 */
export function weekdayLabels(locale: string, style: 'short' | 'long' = 'short'): string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: style, timeZone: 'UTC' });
  return WEEKDAYS.map(weekday => format.format(Date.UTC(2024, 0, weekday)));
}

/** `07:00` — the hour label of a column, always UTC. */
export function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

import { describe, expect, it } from 'vitest';
import {
  buildHeatmapGrid,
  coveredDays,
  hourLabel,
  HOURS_PER_DAY,
  weekdayLabels,
} from '@/utils/failureHeatmap';
import type { FailureHeatmapCell, ServiceFailureHeatmap } from '@/data/metrics/MetricsDto';

function cell(over: Partial<FailureHeatmapCell> = {}): FailureHeatmapCell {
  return { weekday: 1, hour: 0, runs: 100, failedRuns: 0, ...over };
}

function heatmap(over: Partial<ServiceFailureHeatmap> = {}): ServiceFailureHeatmap {
  return {
    days: 90,
    timezone: 'UTC',
    since: '2026-06-22T12:00:00Z',
    until: '2026-09-20T12:00:00Z',
    coveredFrom: '2026-07-04T00:00:00Z',
    coveredTo: '2026-09-20T11:00:00Z',
    totalRuns: 1000,
    totalFailedRuns: 10,
    cells: [cell()],
    ...over,
  };
}

describe('buildHeatmapGrid', () => {
  it('is always seven rows of twenty-four, Monday first', () => {
    const grid = buildHeatmapGrid([]);
    expect(grid.rows).toHaveLength(7);
    for (const row of grid.rows) expect(row).toHaveLength(HOURS_PER_DAY);
  });

  it('puts a cell at the ISO weekday and hour the API gave it', () => {
    const grid = buildHeatmapGrid([cell({ weekday: 7, hour: 23, runs: 5, failedRuns: 1 })]);
    expect(grid.rows[6][23]?.runs).toBe(5);
    expect(grid.rows[0][0]).toBeNull();
  });

  it('leaves an hour with no runs empty, which is not an hour with no failures', () => {
    const grid = buildHeatmapGrid([cell({ hour: 1, runs: 10, failedRuns: 0 })]);
    expect(grid.rows[0][0]).toBeNull();
    expect(grid.rows[0][1]?.failureRatePct).toBe(0);
  });

  it('treats a cell the API sent with zero runs as empty', () => {
    expect(buildHeatmapGrid([cell({ runs: 0, failedRuns: 0 })]).rows[0][0]).toBeNull();
  });

  it('computes the failure rate per cell', () => {
    const grid = buildHeatmapGrid([cell({ runs: 200, failedRuns: 5 })]);
    expect(grid.rows[0][0]?.failureRatePct).toBeCloseTo(2.5);
  });

  it('scales the ramp to the worst cell, not to a hundred percent', () => {
    const grid = buildHeatmapGrid([
      cell({ hour: 0, runs: 100, failedRuns: 1 }),
      cell({ hour: 1, runs: 100, failedRuns: 4 }),
    ]);
    expect(grid.peakRatePct).toBeCloseTo(4);
    expect(grid.rows[0][0]?.intensity).toBeCloseTo(0.25);
    expect(grid.rows[0][1]?.intensity).toBe(1);
  });

  it('gives every cell a zero intensity when nothing ever failed', () => {
    const grid = buildHeatmapGrid([cell({ runs: 50, failedRuns: 0 })]);
    expect(grid.peakRatePct).toBe(0);
    expect(grid.rows[0][0]?.intensity).toBe(0);
  });
});

describe('coveredDays', () => {
  it('counts the span the data actually covers, not the one requested', () => {
    expect(coveredDays(heatmap({
      days: 90,
      coveredFrom: '2026-09-01T00:00:00Z',
      coveredTo: '2026-09-15T00:00:00Z',
    }))).toBe(14);
  });

  it('is at least a day for a service with a single covered hour', () => {
    expect(coveredDays(heatmap({
      coveredFrom: '2026-09-15T08:00:00Z',
      coveredTo: '2026-09-15T09:00:00Z',
    }))).toBe(1);
  });

  it('is null for a service with no history at all', () => {
    expect(coveredDays(heatmap({ coveredFrom: null, coveredTo: null }))).toBeNull();
    expect(coveredDays(heatmap({ coveredFrom: 'nonsense' }))).toBeNull();
  });
});

describe('weekdayLabels', () => {
  it('starts the week on Monday, in the locale of the viewer', () => {
    expect(weekdayLabels('en-GB')).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
    expect(weekdayLabels('en-GB', 'long')[0]).toBe('Monday');
    expect(weekdayLabels('de-DE')[0]).toBe('Mo');
  });
});

describe('hourLabel', () => {
  it('pads to a two-digit hour', () => {
    expect(hourLabel(0)).toBe('00:00');
    expect(hourLabel(9)).toBe('09:00');
    expect(hourLabel(23)).toBe('23:00');
  });
});

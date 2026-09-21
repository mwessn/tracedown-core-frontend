import { describe, expect, it } from 'vitest';
import {
  bucketFailures,
  bucketSpanMs,
  bucketStatus,
  buildStatusStrip,
  DOWN_FAILURE_SHARE_PCT,
} from '@/utils/statusStrip';
import type { StatBucket } from '@/data/metrics/MetricsDto';

function bucket(over: Partial<StatBucket> = {}): StatBucket {
  return {
    bucketStart: '2026-09-20T10:00:00Z',
    p50Ms: 100,
    p95Ms: 200,
    p99Ms: 300,
    uptimePct: 100,
    errorRatePct: 0,
    probeCount: 10,
    ...over,
  };
}

describe('bucketFailures', () => {
  it('is the rounded complement of the uptime percentage', () => {
    expect(bucketFailures(bucket({ probeCount: 10, uptimePct: 90 }))).toBe(1);
    expect(bucketFailures(bucket({ probeCount: 60, uptimePct: 98.33 }))).toBe(1);
    expect(bucketFailures(bucket({ probeCount: 10, uptimePct: 100 }))).toBe(0);
    expect(bucketFailures(bucket({ probeCount: 10, uptimePct: 0 }))).toBe(10);
  });

  it('never leaves 0..runs, whatever the percentage says', () => {
    expect(bucketFailures(bucket({ probeCount: 4, uptimePct: -5 }))).toBe(4);
    expect(bucketFailures(bucket({ probeCount: 4, uptimePct: 120 }))).toBe(0);
  });

  it('is zero for a bucket nothing ran in', () => {
    expect(bucketFailures(bucket({ probeCount: 0, uptimePct: null }))).toBe(0);
  });
});

describe('bucketStatus', () => {
  it('is neutral for a bucket with no runs, never green', () => {
    expect(bucketStatus(bucket({ probeCount: 0, uptimePct: null }))).toBe('none');
    expect(bucketStatus(bucket({ probeCount: 0, uptimePct: 100 }))).toBe('none');
    expect(bucketStatus(bucket({ probeCount: 5, uptimePct: null }))).toBe('none');
  });

  it('is green only when every run passed', () => {
    expect(bucketStatus(bucket({ probeCount: 12, uptimePct: 100 }))).toBe('ok');
    // 1 failure in 240 rounds to 0 — the strip and the tooltip agree on zero.
    expect(bucketStatus(bucket({ probeCount: 240, uptimePct: 99.9 }))).toBe('ok');
  });

  it('is amber while under half the runs failed', () => {
    expect(bucketStatus(bucket({ probeCount: 10, uptimePct: 90 }))).toBe('degraded');
    expect(bucketStatus(bucket({ probeCount: 100, uptimePct: 51 }))).toBe('degraded');
  });

  it('is red from half the runs failed upward', () => {
    expect(bucketStatus(bucket({ probeCount: 10, uptimePct: 50 }))).toBe('down');
    expect(bucketStatus(bucket({ probeCount: 10, uptimePct: 10 }))).toBe('down');
    expect(bucketStatus(bucket({ probeCount: 10, uptimePct: 0 }))).toBe('down');
    expect(DOWN_FAILURE_SHARE_PCT).toBe(50);
  });
});

describe('bucketSpanMs', () => {
  it('is an hour for hourly buckets and a day for daily ones', () => {
    expect(bucketSpanMs('hourly')).toBe(3_600_000);
    expect(bucketSpanMs('daily')).toBe(86_400_000);
    // Anything unrecognised falls back to the short bucket rather than
    // stretching a cell over a day it does not cover.
    expect(bucketSpanMs('weekly')).toBe(3_600_000);
  });
});

describe('buildStatusStrip', () => {
  it('keeps one cell per bucket, in order', () => {
    const cells = buildStatusStrip(
      [
        bucket({ bucketStart: '2026-09-20T10:00:00Z' }),
        bucket({ bucketStart: '2026-09-20T11:00:00Z', uptimePct: 80 }),
        bucket({ bucketStart: '2026-09-20T12:00:00Z', probeCount: 0, uptimePct: null }),
      ],
      'hourly',
    );
    expect(cells.map(c => c.bucketStart)).toEqual([
      '2026-09-20T10:00:00Z',
      '2026-09-20T11:00:00Z',
      '2026-09-20T12:00:00Z',
    ]);
    expect(cells.map(c => c.status)).toEqual(['ok', 'degraded', 'none']);
  });

  it('gives each cell the span its bucket type covers', () => {
    const [hourly] = buildStatusStrip([bucket()], 'hourly');
    expect(hourly.endMs - hourly.startMs).toBe(3_600_000);
    expect(hourly.startMs).toBe(Date.parse('2026-09-20T10:00:00Z'));
    const [daily] = buildStatusStrip([bucket()], 'daily');
    expect(daily.endMs - daily.startMs).toBe(86_400_000);
  });

  it('carries the numbers the tooltip prints', () => {
    const [cell] = buildStatusStrip([bucket({ probeCount: 20, uptimePct: 95 })], 'hourly');
    expect(cell.runs).toBe(20);
    expect(cell.failures).toBe(1);
    expect(cell.uptimePct).toBe(95);
  });

  it('survives an unparseable bucket start instead of drawing a NaN cell', () => {
    const [cell] = buildStatusStrip([bucket({ bucketStart: 'not a date' })], 'hourly');
    expect(Number.isNaN(cell.startMs)).toBe(true);
    expect(Number.isNaN(cell.endMs)).toBe(true);
    expect(cell.status).toBe('ok');
  });

  it('is empty for an empty window', () => {
    expect(buildStatusStrip([], 'hourly')).toEqual([]);
  });
});

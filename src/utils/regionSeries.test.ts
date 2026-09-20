import { describe, expect, it } from 'vitest';
import { assignRegionColorVars, buildRegionLatencyModel, REGION_COLOR_VARS } from '@/utils/regionSeries';
import type { RegionSeries, StatBucket } from '@/data/metrics/MetricsDto';

function bucket(bucketStart: string, p95Ms: number | null): StatBucket {
  return { bucketStart, p50Ms: 10, p95Ms, p99Ms: 30, uptimePct: 100, errorRatePct: 0, probeCount: 5 };
}

function region(agentId: number, buckets: StatBucket[], agentLabel = `agent-${agentId}`): RegionSeries {
  return { agentId, agentLabel, buckets };
}

describe('assignRegionColorVars', () => {
  it('gives every region a distinct slot while there are slots left', () => {
    const colors = assignRegionColorVars([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(new Set(colors.values()).size).toBe(REGION_COLOR_VARS.length);
  });

  it('derives the slot from the agent id, not its position in the list', () => {
    const forward = assignRegionColorVars([3, 9, 17]);
    const reversed = assignRegionColorVars([17, 9, 3]);
    expect([...forward.entries()]).toEqual([...reversed.entries()]);
  });

  it('keeps a region on its colour when another region disappears', () => {
    const all = assignRegionColorVars([2, 5, 11]);
    const fewer = assignRegionColorVars([2, 11]);
    expect(fewer.get(2)).toBe(all.get(2));
    expect(fewer.get(11)).toBe(all.get(11));
  });

  it('walks to a free slot when two agents want the same one', () => {
    // 1 and 9 both prefer slot 1 with an eight-colour palette.
    const colors = assignRegionColorVars([1, 9]);
    expect(colors.get(1)).toBe(REGION_COLOR_VARS[1]);
    expect(colors.get(9)).toBe(REGION_COLOR_VARS[2]);
  });

  it('reuses colours rather than spinning once every slot is taken', () => {
    const ids = Array.from({ length: 12 }, (_, i) => i + 1);
    const colors = assignRegionColorVars(ids);
    expect(colors.size).toBe(12);
    for (const value of colors.values()) expect(REGION_COLOR_VARS).toContain(value);
  });
});

describe('buildRegionLatencyModel', () => {
  it('plots every region against the union of their buckets, ascending', () => {
    const model = buildRegionLatencyModel([
      region(1, [bucket('2026-09-20T11:00:00Z', 120), bucket('2026-09-20T10:00:00Z', 100)]),
      region(2, [bucket('2026-09-20T12:00:00Z', 300)]),
    ]);
    expect(model.bucketStarts).toEqual([
      '2026-09-20T10:00:00Z',
      '2026-09-20T11:00:00Z',
      '2026-09-20T12:00:00Z',
    ]);
  });

  it('leaves a gap where a region has no bucket, never a zero', () => {
    const model = buildRegionLatencyModel([
      region(1, [bucket('2026-09-20T10:00:00Z', 100)]),
      region(2, [bucket('2026-09-20T11:00:00Z', 300)]),
    ]);
    expect(model.lines[0].values).toEqual([100, null]);
    expect(model.lines[1].values).toEqual([null, 300]);
  });

  it('plots p95 and carries the label the region table shows', () => {
    const model = buildRegionLatencyModel([region(7, [bucket('2026-09-20T10:00:00Z', 250)], 'eu-central')]);
    expect(model.lines[0].agentLabel).toBe('eu-central');
    expect(model.lines[0].values).toEqual([250]);
  });

  it('carries a bucket whose p95 is missing through as a gap', () => {
    const model = buildRegionLatencyModel([region(1, [bucket('2026-09-20T10:00:00Z', null)])]);
    expect(model.lines[0].values).toEqual([null]);
  });

  it('keeps the API order of the regions for the legend', () => {
    const model = buildRegionLatencyModel([
      region(9, [bucket('2026-09-20T10:00:00Z', 1)]),
      region(2, [bucket('2026-09-20T10:00:00Z', 2)]),
    ]);
    expect(model.lines.map(l => l.agentId)).toEqual([9, 2]);
  });

  it('is empty for a service with no regions', () => {
    expect(buildRegionLatencyModel([])).toEqual({ bucketStarts: [], lines: [] });
  });
});

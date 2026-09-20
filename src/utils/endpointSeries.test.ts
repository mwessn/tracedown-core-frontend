import { describe, expect, it } from 'vitest';
import {
  alignPoints,
  buildPhaseTrend,
  buildSizeTrend,
  hasPhasePoints,
  TOP_SIZE_SERIES,
} from '@/utils/endpointSeries';
import { REGION_COLOR_VARS } from '@/utils/regionSeries';
import type {
  EndpointPhases,
  EndpointSeries,
  EndpointSeriesPoint,
  ServiceEndpointSeries,
} from '@/data/metrics/MetricsDto';

const BUCKETS = ['2026-09-19T10:00:00Z', '2026-09-19T11:00:00Z', '2026-09-19T12:00:00Z'];

function phases(over: Partial<EndpointPhases> = {}): EndpointPhases {
  return { dnsMs: 1, connectMs: 2, tlsMs: 3, ttfbMs: 4, transferMs: 5, responseMs: 15, ...over };
}

function point(over: Partial<EndpointSeriesPoint> = {}): EndpointSeriesPoint {
  return { bucketStart: BUCKETS[0], calls: 10, phases: phases(), avgSizeBytes: 400, ...over };
}

function endpoint(over: Partial<EndpointSeries> = {}): EndpointSeries {
  return {
    key: 'GET {p.baseUrl}/orders',
    method: 'GET',
    template: '{p.baseUrl}/orders',
    points: [point()],
    ...over,
  };
}

function series(over: Partial<ServiceEndpointSeries> = {}): ServiceEndpointSeries {
  return {
    window: '24h',
    bucketType: 'hourly',
    buckets: BUCKETS,
    all: { points: [point()] },
    endpoints: [endpoint()],
    endpointsTruncated: false,
    ...over,
  };
}

describe('alignPoints', () => {
  it('lays a sparse series onto the shared axis', () => {
    const aligned = alignPoints(BUCKETS, [point({ bucketStart: BUCKETS[2], calls: 3 })]);
    expect(aligned[0]).toBeNull();
    expect(aligned[1]).toBeNull();
    expect(aligned[2]?.calls).toBe(3);
  });

  it('ignores a point the axis does not carry', () => {
    const aligned = alignPoints(BUCKETS, [point({ bucketStart: '2026-01-01T00:00:00Z' })]);
    expect(aligned).toEqual([null, null, null]);
  });

  it('is all nulls for a series with no points', () => {
    expect(alignPoints(BUCKETS, [])).toEqual([null, null, null]);
  });
});

describe('buildPhaseTrend', () => {
  it('stacks the five phases in the order they happen', () => {
    const trend = buildPhaseTrend(BUCKETS, [point()]);
    expect(trend.map(s => s.phase)).toEqual(['dns', 'connect', 'tls', 'ttfb', 'transfer']);
    expect(trend.map(s => s.values[0])).toEqual([1, 2, 3, 4, 5]);
  });

  it('leaves a gap, not a zero, where a bucket has no point', () => {
    const trend = buildPhaseTrend(BUCKETS, [point({ bucketStart: BUCKETS[1] })]);
    expect(trend[0].values).toEqual([null, 1, null]);
  });

  it('leaves a gap where a bucket timed no call at all', () => {
    const trend = buildPhaseTrend(BUCKETS, [point({ phases: null })]);
    expect(trend[3].values).toEqual([null, null, null]);
  });

  it('takes each phase colour from the phase tokens', () => {
    const trend = buildPhaseTrend(BUCKETS, [point()]);
    expect(trend.map(s => s.colorVar)).toEqual([
      '--chart-phase-dns',
      '--chart-phase-connect',
      '--chart-phase-tls',
      '--chart-phase-ttfb',
      '--chart-phase-transfer',
    ]);
  });
});

describe('hasPhasePoints', () => {
  it('is true as soon as one bucket carries timings', () => {
    expect(hasPhasePoints([point({ phases: null }), point()])).toBe(true);
  });

  it('is false for a series that timed nothing', () => {
    expect(hasPhasePoints([point({ phases: null })])).toBe(false);
    expect(hasPhasePoints([])).toBe(false);
  });
});

describe('buildSizeTrend', () => {
  it('drops endpoints that never reported a size', () => {
    const model = buildSizeTrend(series({
      endpoints: [
        endpoint({ key: 'sized' }),
        endpoint({ key: 'unsized', points: [point({ avgSizeBytes: null })] }),
      ],
    }));
    expect(model.map(s => s.key)).toEqual(['sized']);
  });

  it('ranks the busiest endpoint first, whatever order the API sent', () => {
    const model = buildSizeTrend(series({
      endpoints: [
        endpoint({ key: 'quiet', points: [point({ calls: 5 })] }),
        endpoint({ key: 'busy', points: [point({ calls: 50 }), point({ bucketStart: BUCKETS[1], calls: 40 })] }),
      ],
    }));
    expect(model.map(s => s.key)).toEqual(['busy', 'quiet']);
    expect(model[0].calls).toBe(90);
  });

  it('starts only the busiest few visible and leaves the rest to the legend', () => {
    const many = Array.from({ length: TOP_SIZE_SERIES + 3 }, (_, i) =>
      endpoint({ key: `e${i}`, points: [point({ calls: 100 - i })] }));
    const model = buildSizeTrend(series({ endpoints: many }));
    expect(model.filter(s => s.visible)).toHaveLength(TOP_SIZE_SERIES);
    expect(model.slice(TOP_SIZE_SERIES).every(s => !s.visible)).toBe(true);
  });

  it('honours a caller-supplied top count', () => {
    const many = Array.from({ length: 4 }, (_, i) => endpoint({ key: `e${i}` }));
    expect(buildSizeTrend(series({ endpoints: many }), 2).filter(s => s.visible)).toHaveLength(2);
  });

  it('lays the sizes onto the shared axis with gaps where there was no call', () => {
    const model = buildSizeTrend(series({
      endpoints: [endpoint({ points: [point({ bucketStart: BUCKETS[1], avgSizeBytes: 900 })] })],
    }));
    expect(model[0].values).toEqual([null, 900, null]);
  });

  it('takes colours from the categorical palette, in rank order', () => {
    const model = buildSizeTrend(series({
      endpoints: [endpoint({ key: 'a' }), endpoint({ key: 'b', points: [point({ calls: 1 })] })],
    }));
    expect(model.map(s => s.colorVar)).toEqual([REGION_COLOR_VARS[0], REGION_COLOR_VARS[1]]);
  });

  it('is empty for a service with no endpoints', () => {
    expect(buildSizeTrend(series({ endpoints: [] }))).toEqual([]);
  });
});

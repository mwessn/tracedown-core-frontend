/**
 * Pure model builders for the two per-endpoint *series* panels: the phase trend
 * and the response-size trend.
 *
 * The API sends sparse series against a shared bucket axis — an endpoint that
 * was not called in a bucket has no point there. Aligning that onto the axis,
 * and deciding which size lines start visible, is all decided here so the
 * components stay Chart.js glue.
 */

import { PHASE_KEYS, phaseColorVar, type PhaseKey } from '@/utils/endpointStats';
import { REGION_COLOR_VARS } from '@/utils/regionSeries';
import type {
  EndpointPhases,
  EndpointSeries,
  EndpointSeriesPoint,
  ServiceEndpointSeries,
} from '@/data/metrics/MetricsDto';

/** Size lines drawn from the start; the rest arrive hidden and come back via the legend. */
export const TOP_SIZE_SERIES = 5;

const PHASE_FIELDS: Record<PhaseKey, keyof EndpointPhases> = {
  dns: 'dnsMs',
  connect: 'connectMs',
  tls: 'tlsMs',
  ttfb: 'ttfbMs',
  transfer: 'transferMs',
};

/**
 * A sparse series laid onto the shared axis: one slot per bucket, `null` where
 * the series has no point. Never zero — "not called" and "took no time" are
 * different things, and a zero would draw a cliff.
 */
export function alignPoints(
  buckets: readonly string[],
  points: readonly EndpointSeriesPoint[],
): (EndpointSeriesPoint | null)[] {
  const byStart = new Map(points.map(p => [p.bucketStart, p]));
  return buckets.map(start => byStart.get(start) ?? null);
}

/** One phase, as a stacked band across the bucket axis. */
export interface PhaseTrendSeries {
  phase: PhaseKey;
  colorVar: string;
  values: (number | null)[];
}

/**
 * Phase bands over time for one endpoint (or for the whole service).
 *
 * A bucket that timed no call has `phases: null` and contributes a gap to every
 * band, so the stack never invents a zeroed hour out of a missing denominator.
 */
export function buildPhaseTrend(
  buckets: readonly string[],
  points: readonly EndpointSeriesPoint[],
): PhaseTrendSeries[] {
  const aligned = alignPoints(buckets, points);
  return PHASE_KEYS.map<PhaseTrendSeries>(phase => ({
    phase,
    colorVar: phaseColorVar(phase),
    values: aligned.map(point => point?.phases?.[PHASE_FIELDS[phase]] ?? null),
  }));
}

/** True when at least one bucket of a series carries timings worth stacking. */
export function hasPhasePoints(points: readonly EndpointSeriesPoint[]): boolean {
  return points.some(p => p.phases !== null);
}

/** One endpoint's average response size across the bucket axis. */
export interface SizeTrendSeries {
  key: string;
  method: string;
  template: string;
  colorVar: string;
  values: (number | null)[];
  /** Calls over the whole window — what the top-N selection ranks by. */
  calls: number;
  /** Drawn from the start; the rest are legend entries the viewer can switch on. */
  visible: boolean;
}

/**
 * Size lines, busiest endpoint first.
 *
 * Endpoints that never reported a size are dropped — a response with no body
 * measurement has nothing to plot — and only the busiest few start visible: ten
 * lines at once is a thicket, and the legend puts any of them back.
 */
export function buildSizeTrend(series: ServiceEndpointSeries, topCount = TOP_SIZE_SERIES): SizeTrendSeries[] {
  const withSizes = series.endpoints.filter(e => e.points.some(p => p.avgSizeBytes != null));
  const ranked = [...withSizes].sort((a, b) => totalCalls(b) - totalCalls(a));
  return ranked.map((endpoint, index) => ({
    key: endpoint.key,
    method: endpoint.method,
    template: endpoint.template,
    // The colour follows the endpoint's rank in this panel, which is the only
    // place the endpoint is drawn as a line — nothing else has to agree with it.
    colorVar: REGION_COLOR_VARS[index % REGION_COLOR_VARS.length],
    values: alignPoints(series.buckets, endpoint.points).map(p => p?.avgSizeBytes ?? null),
    calls: totalCalls(endpoint),
    visible: index < topCount,
  }));
}

function totalCalls(endpoint: EndpointSeries): number {
  return endpoint.points.reduce((sum, p) => sum + p.calls, 0);
}

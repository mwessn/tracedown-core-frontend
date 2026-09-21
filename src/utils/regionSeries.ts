/**
 * Per-region latency model for the statistics tab.
 *
 * The statistics response already carries a bucket series per probe agent; this
 * turns those into one line per region on a single shared timeline, with a
 * colour each region keeps.
 */

import type { RegionSeries, StatBucket } from '@/data/metrics/MetricsDto';

/**
 * The categorical series palette, in slot order. Never cycled by rank: a colour
 * follows a region, not its position, so hiding one line does not repaint the
 * others.
 */
export const REGION_COLOR_VARS = [
  '--chart-series-1',
  '--chart-series-2',
  '--chart-series-3',
  '--chart-series-4',
  '--chart-series-5',
  '--chart-series-6',
  '--chart-series-7',
  '--chart-series-8',
] as const;

/**
 * A colour slot per agent.
 *
 * The slot is derived from the agent's own id, so a region keeps its colour
 * across windows and across a reload, and a region that drops out of one window
 * does not shift the rest. Two agents can want the same slot (there are more
 * agents than colours); the later one walks to the next free slot, which is why
 * the walk runs in id order — the assignment must not depend on the order the
 * API happened to list the regions in.
 */
export function assignRegionColorVars(agentIds: readonly number[]): Map<number, string> {
  const slots = REGION_COLOR_VARS.length;
  const taken = new Set<number>();
  const assigned = new Map<number, string>();
  for (const agentId of [...new Set(agentIds)].sort((a, b) => a - b)) {
    const preferred = ((Math.trunc(agentId) % slots) + slots) % slots;
    let slot = preferred;
    // More regions than colours: every slot is taken and the walk would spin.
    for (let step = 0; step < slots && taken.has(slot); step++) {
      slot = (preferred + step + 1) % slots;
    }
    taken.add(slot);
    assigned.set(agentId, REGION_COLOR_VARS[slot]);
  }
  return assigned;
}

/** One region's line: a value per timeline bucket, `null` where it has none. */
export interface RegionLine {
  agentId: number;
  agentLabel: string;
  colorVar: string;
  values: (number | null)[];
}

export interface RegionLatencyModel {
  /** Bucket starts every line is plotted against, ascending. */
  bucketStarts: string[];
  lines: RegionLine[];
}

/**
 * p95 per region over one shared x axis.
 *
 * p95 is the percentile the region table already reports and the one the
 * all-regions chart is read for; plotting three percentiles × eight regions
 * would be twenty-four lines on one canvas.
 *
 * Regions do not have to share a bucket set — an agent added mid-window, or one
 * that ran nothing for an hour, simply has no bucket there. The timeline is the
 * union of every region's buckets and a missing bucket becomes `null`, which
 * the chart spans rather than drawing as a drop to zero.
 */
export function buildRegionLatencyModel(regions: readonly RegionSeries[]): RegionLatencyModel {
  const bucketStarts = [...new Set(regions.flatMap(r => r.buckets.map(b => b.bucketStart)))].sort();
  const colors = assignRegionColorVars(regions.map(r => r.agentId));
  const lines = regions.map<RegionLine>((region) => {
    const byStart = new Map<string, StatBucket>(region.buckets.map(b => [b.bucketStart, b]));
    return {
      agentId: region.agentId,
      agentLabel: region.agentLabel,
      colorVar: colors.get(region.agentId) ?? REGION_COLOR_VARS[0],
      values: bucketStarts.map(start => byStart.get(start)?.p95Ms ?? null),
    };
  });
  return { bucketStarts, lines };
}

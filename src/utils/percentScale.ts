/**
 * The one scale every percentage on the statistics tab is drawn on: a fixed
 * 0–100, with ticks that never move.
 *
 * This used to auto-scale to the data and only cap the top at 100. That made a
 * chart honest about its own numbers and useless for comparison: a 30% error
 * rate and a 50% one filled the same canvas, and telling them apart meant
 * reading the tick labels — as did telling either from a 0.3% one. A percentage
 * has a fixed ceiling and a fixed floor, so the axis has them too, and the
 * height of a line means the same thing on every chart and in every window.
 */

/** Chart.js scale options for a percentage axis. */
export interface PercentScale {
  min: number;
  max: number;
  ticks: { stepSize: number };
}

/** Quarters — five labels, the most a 200px chart carries without crowding. */
export const PERCENT_TICK_STEP = 25;

/**
 * Pixels a dataset may draw outside the chart area.
 *
 * A line at exactly 100% (or 0%) sits on the boundary, and Chart.js clips to
 * the chart area by default — half the stroke, and the top half of any point,
 * would be cut off. A healthy service is flat at 100 nearly always, so this is
 * the normal case, not an edge one.
 */
export const PERCENT_EDGE_CLIP_PX = 4;

/** The fixed axis. Takes no data: its bounds do not depend on any. */
export function fixedPercentScale(stepSize: number = PERCENT_TICK_STEP): PercentScale {
  return { min: 0, max: 100, ticks: { stepSize } };
}

import { describe, expect, it } from 'vitest';
import { fixedPercentScale, PERCENT_EDGE_CLIP_PX, PERCENT_TICK_STEP } from '@/utils/percentScale';

describe('fixedPercentScale', () => {
  it('runs from exactly 0 to exactly 100', () => {
    expect(fixedPercentScale()).toEqual({ min: 0, max: 100, ticks: { stepSize: PERCENT_TICK_STEP } });
  });

  it('is the same axis whatever the data does — it never sees any', () => {
    // The point of the fixed scale: a 30% and a 50% error rate are drawn at
    // different heights, and a series flat at 100 is not zoomed into.
    expect(fixedPercentScale()).toEqual(fixedPercentScale());
    // Its only parameter is the optional tick step — there is no series
    // argument to scale to, which is the guarantee this locks.
    expect(fixedPercentScale.length).toBe(0);
  });

  it('lands its ticks on round numbers, ending on both bounds', () => {
    const { min, max, ticks } = fixedPercentScale();
    const labels: number[] = [];
    for (let value = min; value <= max; value += ticks.stepSize) labels.push(value);
    expect(labels).toEqual([0, 25, 50, 75, 100]);
  });

  it('takes a step of its own for a chart with more room', () => {
    const { ticks } = fixedPercentScale(20);
    expect(ticks.stepSize).toBe(20);
    expect(100 % ticks.stepSize).toBe(0);
  });

  it('leaves room for a line drawn on the boundary', () => {
    // 0% and 100% are where these series actually sit; a stroke there must not
    // be halved by the chart-area clip.
    expect(PERCENT_EDGE_CLIP_PX).toBeGreaterThan(0);
  });
});

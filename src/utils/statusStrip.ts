/**
 * The status strip's model: one `probe_aggregates` bucket becomes one cell.
 *
 * A cell is a verdict, not a measurement — the thresholds below are the whole
 * of it, so they live here next to the data they read rather than inside a
 * template.
 */

import type { StatBucket } from '@/data/metrics/MetricsDto';

/**
 * What one bucket's runs say about the service in that span.
 *
 * - `none` — the bucket holds no runs at all (the service was paused, created
 *   later, or the window reaches back before it existed). Neutral, never green:
 *   "nothing ran" is not "everything passed".
 * - `ok` — every run passed.
 * - `degraded` — some runs failed, but fewer than half of them.
 * - `down` — at least half the runs failed. Half an hour of an hourly bucket is
 *   an outage, not a blip, and a strip that only reddens at 100% would show a
 *   service failing nine runs in ten as merely amber.
 */
export type BucketStatus = 'none' | 'ok' | 'degraded' | 'down';

/** Failed share (percent) from which a bucket counts as down rather than degraded. */
export const DOWN_FAILURE_SHARE_PCT = 50;

/**
 * Runs in the bucket that did not pass.
 *
 * The API sends an uptime percentage, not a failure count, so this is the
 * rounded complement — the same number the tooltip prints and the status is
 * decided from, so the two can never disagree.
 */
export function bucketFailures(bucket: StatBucket): number {
  if (bucket.uptimePct == null || bucket.probeCount <= 0) return 0;
  const failed = (bucket.probeCount * (100 - bucket.uptimePct)) / 100;
  return Math.min(bucket.probeCount, Math.max(0, Math.round(failed)));
}

/** Verdict for one bucket, by the thresholds documented on `BucketStatus`. */
export function bucketStatus(bucket: StatBucket): BucketStatus {
  if (bucket.probeCount <= 0 || bucket.uptimePct == null) return 'none';
  const failures = bucketFailures(bucket);
  if (failures === 0) return 'ok';
  const failedShare = (failures / bucket.probeCount) * 100;
  return failedShare >= DOWN_FAILURE_SHARE_PCT ? 'down' : 'degraded';
}

/** Length of one bucket in milliseconds, by the bucket type the API reports. */
export function bucketSpanMs(bucketType: string): number {
  return bucketType === 'daily' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
}

/** One cell of the strip: a verdict plus everything its tooltip has to say. */
export interface StatusCell {
  /** The bucket start, verbatim — also the cell's list key. */
  bucketStart: string;
  status: BucketStatus;
  /** Epoch milliseconds of the span this cell covers; `end` is exclusive. */
  startMs: number;
  endMs: number;
  runs: number;
  failures: number;
  /** Null exactly when the bucket had no runs. */
  uptimePct: number | null;
}

/** The strip, in bucket order — the same order and length as the line charts' x axis. */
export function buildStatusStrip(buckets: readonly StatBucket[], bucketType: string): StatusCell[] {
  const span = bucketSpanMs(bucketType);
  return buckets.map((bucket) => {
    const startMs = new Date(bucket.bucketStart).getTime();
    return {
      bucketStart: bucket.bucketStart,
      status: bucketStatus(bucket),
      startMs,
      endMs: Number.isNaN(startMs) ? startMs : startMs + span,
      runs: bucket.probeCount,
      failures: bucketFailures(bucket),
      uptimePct: bucket.uptimePct,
    };
  });
}

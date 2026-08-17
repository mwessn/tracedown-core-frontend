export interface MetricsCounters {
  probesTotal: number;
  probesSuccess: number;
  probesFailure: number;
  probesTimeout: number;
}

export interface MetricsState {
  lastStatus: string | null;
  lastConsecutive: number;
  lastResponseMs: number;
  lastRunAt: number | null;
}

export interface ResponsePercentiles {
  p50: number;
  p95: number;
  p99: number;
}

export interface ServiceMetricsDto {
  counters: MetricsCounters;
  state: MetricsState;
  percentiles: ResponsePercentiles | null;
  /** Accessible-set totals — present only on aggregate (workspace/project) responses. */
  projectCount?: number | null;
  serviceCount?: number | null;
}

/**
 * Server-aggregated probe roll-up delta (`metrics.delta` realtime events):
 * counts observed since the last flush interval.
 */
export interface MetricsDelta {
  total: number;
  success: number;
  failure: number;
  timeout: number;
  sumMs: number;
  callCount: number;
}

/** One hour of aggregated probe activity (`hour` format: `yyyyMMddHH`). */
export interface HourlyBucket {
  hour: string;
  total: number;
  success: number;
  failure: number;
  timeout: number;
  sumMs: number;
  callCount: number;
}

/** One `probe_aggregates` bucket, as a statistics time-series point. */
export interface StatBucket {
  /** ISO-8601 bucket start (UTC). */
  bucketStart: string;
  p50Ms: number | null;
  p95Ms: number | null;
  p99Ms: number | null;
  /** Percentage 0..100; null when the bucket had no runs. */
  uptimePct: number | null;
  errorRatePct: number | null;
  probeCount: number;
}

/** Per-region (per probe agent) statistics series. */
export interface RegionSeries {
  agentId: number;
  agentLabel: string;
  buckets: StatBucket[];
}

/** Deep service statistics from `probe_aggregates`: overall trend + per-region breakdown. */
export interface ServiceStatistics {
  window: string;
  /** "hourly" | "daily". */
  bucketType: string;
  overall: StatBucket[];
  regions: RegionSeries[];
}

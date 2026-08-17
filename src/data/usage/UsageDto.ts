/** Resource scopes that expose a usage view. `org` aggregates the whole org. */
export type UsageScope = 'services' | 'projects' | 'workspaces' | 'org';

/** Aggregated usage over a window (from GET …/usage?hours=…). */
export interface UsageResponse {
  /** The window actually summed, in hours (after capping to retention / 7d). */
  windowHours: number;
  requests: number;
  ingressBytes: number;
  egressBytes: number;
  /** Bytes the scheduler dispatched to probe agents over the window. */
  agentEgressBytes: number;
}

/** Selectable usage windows (hours). Capped server-side at retention / 7d. */
export interface UsagePeriod {
  labelKey: string;
  hours: number;
}

export const USAGE_PERIODS: UsagePeriod[] = [
  { labelKey: 'usage.period2h', hours: 2 },
  { labelKey: 'usage.period24h', hours: 24 },
  { labelKey: 'usage.period3d', hours: 72 },
  { labelKey: 'usage.period7d', hours: 168 },
];

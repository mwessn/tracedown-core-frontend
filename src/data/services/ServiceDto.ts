import type { ServiceMetricsDto } from '@/data/metrics/MetricsDto';

export interface FailedAssertion {
  scope: string;
  expected: string | null;
  actual: string | null;
}

export interface LastFailureInfo {
  assertions: FailedAssertion[];
}

/** One probe run in the recent-history chart. */
export interface ProbePoint {
  status: string;
  avgResponseMs: number;
  callCount: number;
  failedCalls: number;
  timestamp: number;
}

export interface ServiceSummary {
  id: string;
  projectId: string;
  name: string;
  label: string | null;
  script: string;
  schedule: string;
  probeMode: string;
  queuePolicy: string;
  serviceWindow: string | null;
  isActive: boolean;
  lastStatus: string | null;
  lastStatusSince: string | null;
  version: number;
  createdAt: string;
  metrics: ServiceMetricsDto | null;
  lastFailure: LastFailureInfo | null;
}

export interface CreateServiceRequest {
  projectId: string;
  name: string;
  label?: string;
  schedule?: string;
}

/** PATCH /services/{id} — any subset of the editable config fields. */
export interface UpdateServiceConfigRequest {
  name?: string;
  label?: string;
  schedule?: string;
  probeMode?: string;
  queuePolicy?: string;
  /** Maintenance-window RRULE; an empty string clears the window. */
  serviceWindow?: string;
}

export interface UpdateServiceScriptRequest {
  script: string;
  version: number;
}

export interface ToggleServiceRequest {
  isActive: boolean;
}

/** Combined detail + recent probe points, served by /services/{id}/snapshot. */
export interface ServiceSnapshot {
  service: ServiceSummary;
  recentProbes: ProbePoint[];
}

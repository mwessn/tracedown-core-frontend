/**
 * Live channel for a workspace — key doubles as the realtime channel name
 * (`workspace:{id}`). Acquired while a workspace view is open.
 *
 * State is the workspace's rolled-up metrics (kept for the header and as the
 * polling-mode refresh signal); project and variable events carry ids only
 * and are folded into the stores via `onEvent` side effects.
 */

import { defineChannel } from '@/requests';
import type { MetricsDelta, ServiceMetricsDto } from '@/data/metrics/MetricsDto';

type WorkspaceChannelEvents = {
  'project.created': { projectId: string };
  'project.updated': { projectId: string };
  'project.deleted': { projectId: string };
  'variable.changed': { resourceType: string; resourceId: string };
  /** Server-aggregated probe roll-up (one event per flush interval). */
  'metrics.delta': MetricsDelta & {
    /** Per-project breakdown for the project-card grid. */
    projects?: Record<string, MetricsDelta>;
  };
};

export const workspaceChannel = defineChannel<
  ServiceMetricsDto,
  ServiceMetricsDto,
  ServiceMetricsDto,
  WorkspaceChannelEvents
>()({
  key: (workspaceId: string) => `workspace:${workspaceId}`,
  firstFetchUrl: (workspaceId) => `/workspaces/${workspaceId}/metrics`,
  pollUrl: (workspaceId) => `/workspaces/${workspaceId}/metrics`,
  pollFreqMs: 30000,
});

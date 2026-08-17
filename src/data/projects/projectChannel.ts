/**
 * Live channel for a project — key doubles as the realtime channel name
 * (`project:{id}`).
 *
 * State is the project-level rolled-up metrics (an object, as the registry's
 * shallow-merge requires): firstFetch/poll hit `/projects/{id}/metrics`, so in
 * polling mode the header metrics refresh on cadence and views can watch the
 * state as a "data may have moved" signal. The WS events carry per-service
 * deltas that views apply to the service store via `onEvent` side effects.
 */

import { defineChannel } from '@/requests';
import type { FailedAssertion } from '@/data/services/ServiceDto';
import type { ServiceMetricsDto } from '@/data/metrics/MetricsDto';

type ProjectChannelEvents = {
  'probe.completed': {
    serviceId: string;
    status: string;
    avgResponseMs: number;
    callCount?: number;
    failedAssertions?: FailedAssertion[];
  };
  'service.created': { serviceId: string };
  'service.updated': { serviceId: string };
  'service.deleted': { serviceId: string };
  'variable.changed': { resourceType: string; resourceId: string };
};

export const projectChannel = defineChannel<
  ServiceMetricsDto,
  ServiceMetricsDto,
  ServiceMetricsDto,
  ProjectChannelEvents
>()({
  key: (projectId: string) => `project:${projectId}`,
  firstFetchUrl: (projectId) => `/projects/${projectId}/metrics`,
  pollUrl: (projectId) => `/projects/${projectId}/metrics`,
  pollFreqMs: 30000,
});

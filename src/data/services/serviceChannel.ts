/**
 * Live channel for a single service — key doubles as the realtime channel name
 * (`service:{id}`). Acquired only while a service's detail panel is open.
 *
 * State is the combined snapshot (summary + recent probe points) fetched in
 * one round-trip; `probe.completed` events patch it locally in the panel's
 * handler, so live updates cost no extra requests.
 */

import { defineChannel } from '@/requests';
import type { FailedAssertion } from '@/data/services/ServiceDto';
import type { ServiceSnapshot } from '@/data/services/ServiceDto';

type ServiceChannelEvents = {
  'probe.completed': {
    serviceId: string;
    status: string;
    avgResponseMs: number;
    failedAssertions?: FailedAssertion[];
  };
  'variable.changed': { resourceType: string; resourceId: string };
};

export const serviceChannel = defineChannel<
  ServiceSnapshot,
  ServiceSnapshot,
  ServiceSnapshot,
  ServiceChannelEvents
>()({
  key: (serviceId: string) => `service:${serviceId}`,
  firstFetchUrl: (serviceId) => `/services/${serviceId}/snapshot`,
  pollUrl: (serviceId) => `/services/${serviceId}/snapshot`,
  pollFreqMs: 15000,
});

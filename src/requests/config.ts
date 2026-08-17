/**
 * Composition root for the requests library.
 *
 * Wires the three layers from a single {@link RequestHost} and installs the
 * live runtime singleton. The host is the only place app concerns enter the
 * library: base URL, auth, navigation hooks, and error-code resolution.
 */

import type { RequestHost } from '@/requests/types';
import { createHttp, type Http } from '@/requests/http';
import { createBulk, type Bulk } from '@/requests/bulk';
import { LiveConnection } from '@/requests/live/connection';
import { PollScheduler } from '@/requests/live/scheduler';
import { LiveRegistry } from '@/requests/live/registry';
import { setLiveConnection, setLiveRegistry } from '@/requests/runtime';

export interface Requests<Code extends string> {
  http: Http<Code>;
  bulk: Bulk<Code>;
  registry: LiveRegistry<Code>;
}

export function createRequests<Code extends string>(
  host: RequestHost<Code>,
): Requests<Code> {
  const http = createHttp(host);
  const bulk = createBulk(http);
  const connection = new LiveConnection({
    wsUrl: host.wsUrl,
    authToken: host.authToken,
    maxRetries: host.wsMaxRetries,
  });
  const scheduler = new PollScheduler(bulk);
  const registry = new LiveRegistry({ http, connection, scheduler });

  setLiveRegistry(registry as unknown as LiveRegistry<string>);
  setLiveConnection(connection);

  return { http, bulk, registry };
}

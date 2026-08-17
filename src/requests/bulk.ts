/**
 * Layer 2 — bulk requests.
 *
 * Composes many sub-requests into a single `/bulk` round-trip with one auth
 * check server-side. Built on layer 1, exported standalone for independent use,
 * and reused by the live layer's poll scheduler to coalesce due polls.
 */

import type { Http } from '@/requests/http';
import type {
  ApiResponse,
  BulkResponse,
  BulkSubRequest,
  RequestOptions,
} from '@/requests/types';

export type Bulk<Code extends string> = (
  requests: BulkSubRequest[],
  opts?: RequestOptions,
) => Promise<ApiResponse<BulkResponse, Code>>;

export function createBulk<Code extends string>(http: Http<Code>): Bulk<Code> {
  return (requests, opts) =>
    http.post<BulkResponse, { requests: BulkSubRequest[] }>('/bulk', { requests }, opts);
}

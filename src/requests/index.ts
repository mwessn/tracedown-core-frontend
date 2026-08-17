/**
 * Public API of the requests library.
 *
 * Three independently-importable layers over one host configuration:
 *   1. http  — basic transport (returns ApiResponse)
 *   2. bulk  — many sub-requests in one round-trip (built on http)
 *   3. live  — WS channels with HTTP fallback (built on bulk + http)
 *
 * The library never imports app code; everything app-specific is supplied via
 * `createRequests({ ...host })`. Error-code vocabulary and i18n live host-side.
 */

export { createRequests, type Requests } from '@/requests/config';

export type {
  ApiResponse,
  ErrorInfo,
  HttpMethod,
  RequestHost,
  RequestOptions,
  TransportErrorCode,
  BulkSubRequest,
  BulkSubResponse,
  BulkCallResult,
  BulkResponse,
} from '@/requests/types';

export type { Http } from '@/requests/http';
export type { Bulk } from '@/requests/bulk';

export { defineChannel, DEFAULT_POLL_FREQ_MS } from '@/requests/live/types';
export type {
  ChannelDef,
  ChannelSpec,
  EventMap,
  EmptyEvents,
  WsEvent,
  LiveHandler,
} from '@/requests/live/types';

export type { ChannelHandle, ChannelSnapshot } from '@/requests/live/registry';
export type { ConnectionState, LiveEvent } from '@/requests/live/connection';

export {
  useLiveChannel,
  type LiveChannelRefs,
  type UseLiveChannelOptions,
} from '@/requests/vue/useLiveChannel';

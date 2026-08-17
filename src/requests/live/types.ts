/**
 * Type contracts for the live layer.
 *
 * A channel definition carries no behavior — only the URLs/identity factories
 * and (as phantom types) the shape contract. The shared {@link ChannelDef.key}
 * doubles as the subscription identity and the realtime-service channel name.
 *
 * Shape contract: `First` is the full detail fetched once on load; `Poll` is the
 * compact update fetched on the fallback/resync path; both must extend `Core`,
 * the live-updatable subset. That single named overlap is what makes the
 * partial-match constraint *enforced* rather than conventional — a `First` or
 * `Poll` that drifts off `Core` fails to compile at the `defineChannel` call.
 */

declare const PHANTOM: unique symbol;

/** Event-name → payload map. Declare as a `type` alias, not an `interface` —
 *  only closed type literals satisfy the `Record<string, unknown>` constraint. */
export type EventMap = Record<string, unknown>;
export type EmptyEvents = Record<never, never>;

/** Discriminated union of inbound WS events for a channel, keyed by event name. */
export type WsEvent<Events extends EventMap> = {
  [K in keyof Events]: { type: K; data: Events[K] };
}[keyof Events];

/**
 * View-supplied interpreter for WS deltas. Returns a `Partial<Core>` patch the
 * registry merges into the shared state, or nothing to ignore the event. Both
 * poll and WS write only within `Core`; `First` adds detail that is static for
 * the lifetime of the snapshot.
 */
export type LiveHandler<Core, First, Events extends EventMap> = (
  event: WsEvent<Events>,
  current: Readonly<First> | undefined,
) => Partial<Core> | void;

export interface ChannelSpec<P> {
  /** Stable identity + realtime-service channel name. */
  key: (params: P) => string;
  /** URL for the one-shot detailed snapshot fetched before subscription. */
  firstFetchUrl: (params: P) => string;
  /** URL for the compact update used on fallback polling and reconnect resync. */
  pollUrl: (params: P) => string;
  /** Poll cadence in ms. Defaults to {@link DEFAULT_POLL_FREQ_MS}. */
  pollFreqMs?: number;
}

export interface ChannelDef<
  Core,
  First extends Core,
  Poll extends Core,
  Events extends EventMap,
  P,
> {
  key: (params: P) => string;
  firstFetchUrl: (params: P) => string;
  pollUrl: (params: P) => string;
  pollFreqMs: number;
  readonly [PHANTOM]?: { core: Core; first: First; poll: Poll; events: Events; params: P };
}

export const DEFAULT_POLL_FREQ_MS = 30_000;

/**
 * Defines a channel. Curried so the shape generics are given explicitly while
 * the params type is inferred from the spec's factories:
 *
 * ```ts
 * const serviceStatus = defineChannel<ServiceCore, ServiceDetail, ServiceUpdate, ServiceEvents>()({
 *   key: (id: string) => `service:${id}:status`,
 *   firstFetchUrl: (id) => `/services/${id}`,
 *   pollUrl: (id) => `/services/${id}/live`,
 *   pollFreqMs: 3000,
 * });
 * ```
 *
 * The simple case collapses: `defineChannel<ServiceDto>()({ ... })`.
 */
export function defineChannel<
  Core extends object,
  First extends Core = Core,
  Poll extends Core = Core,
  Events extends EventMap = EmptyEvents,
>() {
  return <P>(spec: ChannelSpec<P>): ChannelDef<Core, First, Poll, Events, P> => ({
    key: spec.key,
    firstFetchUrl: spec.firstFetchUrl,
    pollUrl: spec.pollUrl,
    pollFreqMs: spec.pollFreqMs ?? DEFAULT_POLL_FREQ_MS,
  });
}

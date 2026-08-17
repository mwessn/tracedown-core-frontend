/**
 * Live registry — the framework-free core consumers acquire channels through.
 *
 * Per resolved channel identity it owns one shared state slot, refcounted across
 * consumers. The first acquirer (0→1) runs the orchestration:
 *   firstFetch (detailed snapshot) → subscribe WS → arm fallback poll.
 * Later acquirers reuse the populated slot and share the same `ready`. Release
 * (1→0) tears the channel down: unsubscribe + remove from the scheduler.
 *
 * Both poll responses and WS-handler patches are merged into the slot via a
 * shallow spread; the handler is canonical per identity (first registered wins,
 * since two consumers of one channel must agree on interpretation).
 */

import type { Http } from '@/requests/http';
import type { ApiResponse, ErrorInfo } from '@/requests/types';
import { LiveConnection, type ConnectionState } from '@/requests/live/connection';
import { PollScheduler } from '@/requests/live/scheduler';
import type { ChannelDef, EventMap, LiveHandler, WsEvent } from '@/requests/live/types';

type AnyHandler = (event: WsEvent<EventMap>, current: unknown) => Record<string, unknown> | void;

interface EntryRecord {
  identity: string;
  refcount: number;
  value: Record<string, unknown> | undefined;
  pending: boolean;
  error: ErrorInfo<string> | undefined;
  handler?: AnyHandler;
  listeners: Set<() => void>;
  ready: Promise<void>;
}

export interface ChannelSnapshot<First, Code extends string> {
  value: First | undefined;
  pending: boolean;
  error: ErrorInfo<Code> | undefined;
}

export interface ChannelHandle<First, Code extends string> {
  get(): ChannelSnapshot<First, Code>;
  subscribe(listener: () => void): () => void;
  ready: Promise<void>;
  release(): void;
}

export interface RegistryDeps<Code extends string> {
  http: Http<Code>;
  connection: LiveConnection;
  scheduler: PollScheduler<Code>;
}

export class LiveRegistry<Code extends string> {
  private entries = new Map<string, EntryRecord>();
  private hadConnected = false;
  private deps: RegistryDeps<Code>;

  constructor(deps: RegistryDeps<Code>) {
    this.deps = deps;
    this.deps.connection.onEvent((e) => this.dispatch(e.channel, e.event, e.data));
    this.deps.connection.onStateChange((state, prev) => this.onConnState(state, prev));
  }

  acquire<Core, First extends Core, Poll extends Core, Events extends EventMap, P>(
    def: ChannelDef<Core, First, Poll, Events, P>,
    params: P,
    handler?: LiveHandler<Core, First, Events>,
  ): ChannelHandle<First, Code> {
    const identity = def.key(params);
    let entry = this.entries.get(identity);

    if (!entry) {
      entry = this.createEntry(def, params, identity, handler as AnyHandler | undefined);
    } else {
      entry.refcount++;
      if (!entry.handler && handler) entry.handler = handler as AnyHandler;
    }

    const record = entry;
    return {
      ready: record.ready,
      get: () => ({
        value: record.value as First | undefined,
        pending: record.pending,
        error: record.error as ErrorInfo<Code> | undefined,
      }),
      subscribe: (listener) => {
        record.listeners.add(listener);
        return () => record.listeners.delete(listener);
      },
      release: () => this.release(identity),
    };
  }

  dispose() {
    this.deps.scheduler.dispose();
    this.deps.connection.disconnect();
    this.entries.clear();
  }

  // ── internal ──

  private createEntry<Core, First extends Core, Poll extends Core, Events extends EventMap, P>(
    def: ChannelDef<Core, First, Poll, Events, P>,
    params: P,
    identity: string,
    handler: AnyHandler | undefined,
  ): EntryRecord {
    const entry: EntryRecord = {
      identity,
      refcount: 1,
      value: undefined,
      pending: true,
      error: undefined,
      handler,
      listeners: new Set(),
      ready: Promise.resolve(),
    };
    this.entries.set(identity, entry);

    // Orchestration: firstFetch → subscribe WS → arm fallback poll.
    entry.ready = this.firstFetch(def.firstFetchUrl(params), entry).then(() => {
      // The last consumer may have released while the fetch was in flight —
      // subscribing then would leak an ownerless channel + poll entry.
      if (this.entries.get(identity) !== entry) return;
      this.deps.connection.ensureStarted();
      this.deps.connection.subscribe(identity);
      this.deps.scheduler.add({
        identity,
        pollUrl: def.pollUrl(params),
        pollFreqMs: def.pollFreqMs,
        apply: (body) => this.merge(entry, body as Record<string, unknown>),
      });
      if (this.deps.connection.getState() === 'polling') this.deps.scheduler.setPolling(true);
    });

    return entry;
  }

  private async firstFetch(url: string, entry: EntryRecord) {
    // Channel plumbing, not a user action — never drives the loading UI.
    const res: ApiResponse<Record<string, unknown>, Code> = await this.deps.http.get(url, {
      disableLoading: true,
    });
    if (res.success) {
      entry.value = res.data;
      entry.error = undefined;
    } else {
      entry.error = res.errorInfo;
    }
    entry.pending = false;
    this.notify(entry);
  }

  private release(identity: string) {
    const entry = this.entries.get(identity);
    if (!entry) return;
    entry.refcount--;
    if (entry.refcount > 0) return;
    this.deps.connection.unsubscribe(identity);
    this.deps.scheduler.remove(identity);
    this.entries.delete(identity);
  }

  private dispatch(channel: string, event: string, data: Record<string, unknown>) {
    const entry = this.entries.get(channel);
    if (!entry?.handler) return;
    const patch = entry.handler({ type: event, data } as WsEvent<EventMap>, entry.value);
    if (patch) this.merge(entry, patch);
  }

  private merge(entry: EntryRecord, patch: Record<string, unknown>) {
    entry.value = { ...(entry.value ?? {}), ...patch };
    this.notify(entry);
  }

  private notify(entry: EntryRecord) {
    for (const listener of entry.listeners) listener();
  }

  private onConnState(state: ConnectionState, prev: ConnectionState) {
    if (state === 'connected') {
      this.deps.scheduler.setPolling(false);
      if (this.hadConnected && prev !== 'connected') this.deps.scheduler.resync();
      this.hadConnected = true;
    } else if (state === 'polling') {
      this.deps.scheduler.setPolling(true);
    }
  }
}

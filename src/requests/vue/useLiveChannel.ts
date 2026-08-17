/**
 * Vue binding for the live registry — the only framework-aware file in the lib.
 *
 * Call it at the top level of `setup`/`<script setup>` so the automatic
 * `onUnmounted` teardown can bind. It acquires the channel, exposes the shared
 * state as reactive refs, and releases (refcount−1) on unmount — components
 * write no teardown of their own. Passing `params` as a getter makes the
 * subscription follow reactive changes (e.g. a route param), re-binding cleanly.
 */

import { shallowRef, watch, onUnmounted, type Ref } from 'vue';
import type { ErrorInfo } from '@/requests/types';
import type { ChannelHandle } from '@/requests/live/registry';
import type { ChannelDef, EventMap, LiveHandler } from '@/requests/live/types';
import { getLiveRegistry } from '@/requests/runtime';

export interface UseLiveChannelOptions<Core, First, Events extends EventMap> {
  /** Interprets WS deltas into a `Partial<Core>` patch. Required when the channel has events. */
  onEvent?: LiveHandler<Core, First, Events>;
}

export interface LiveChannelRefs<First> {
  state: Ref<First | undefined>;
  pending: Ref<boolean>;
  error: Ref<ErrorInfo<string> | undefined>;
  ready: Ref<Promise<void>>;
}

export function useLiveChannel<Core, First extends Core, Poll extends Core, Events extends EventMap, P>(
  def: ChannelDef<Core, First, Poll, Events, P>,
  params: P | (() => P),
  opts?: UseLiveChannelOptions<Core, First, Events>,
): LiveChannelRefs<First> {
  const registry = getLiveRegistry();

  const state = shallowRef<First>();
  const pending = shallowRef<boolean>(true);
  const error = shallowRef<ErrorInfo<string>>();
  const ready = shallowRef<Promise<void>>(Promise.resolve());

  let handle: ChannelHandle<First, string> | null = null;
  let unsub: (() => void) | null = null;

  function teardown() {
    unsub?.();
    unsub = null;
    handle?.release();
    handle = null;
  }

  function bind(p: P) {
    teardown();
    handle = registry.acquire(def, p, opts?.onEvent) as ChannelHandle<First, string>;
    ready.value = handle.ready;
    const sync = () => {
      const snap = handle!.get();
      state.value = snap.value;
      pending.value = snap.pending;
      error.value = snap.error;
    };
    unsub = handle.subscribe(sync);
    sync();
  }

  if (typeof params === 'function') {
    watch(params as () => P, (p) => bind(p), { immediate: true });
  } else {
    bind(params);
  }

  onUnmounted(teardown);

  return { state, pending, error, ready };
}

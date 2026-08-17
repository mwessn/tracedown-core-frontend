/**
 * WebSocket connection manager — transport only.
 *
 * Manages the realtime-service socket: connect, reconnect with backoff,
 * ping/pong keepalive, and channel (un)subscription. It does NOT poll — polling
 * is owned by the scheduler. The connection only reports its state so the
 * registry can arm/disarm the scheduler accordingly.
 *
 * Reconnect: up to MAX_RECONNECT_ATTEMPTS with delays [0,1s,2s,4s,8s]; on
 * exhaustion (or no WS URL) it settles in `polling` state for the session.
 */

const isDev = import.meta.env.DEV;
// eslint-disable-next-line no-console
function log(...args: unknown[]) { if (isDev) console.log('[ws]', ...args); }

const PING_INTERVAL_MS = 10_000;
// Generous deadline: a pong delayed past this closes and reconnects the
// socket, so it must absorb transient event-loop stalls (dispatch bursts).
const PONG_TIMEOUT_MS = 15_000;
const RECONNECT_DELAYS = [0, 1_000, 2_000, 4_000, 8_000];
const MAX_RECONNECT_DELAY_MS = 8_000;

export interface LiveEvent {
  channel: string;
  event: string;
  data: Record<string, unknown>;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'polling';

type EventSink = (event: LiveEvent) => void;
type StateListener = (state: ConnectionState, prev: ConnectionState) => void;

export interface ConnectionConfig {
  wsUrl: () => string | undefined;
  authToken: () => string | undefined;
  /** Max reconnect attempts before falling back to polling. 0 ⇒ never use WS. */
  maxRetries: number;
}

export class LiveConnection {
  private ws: WebSocket | null = null;
  private state: ConnectionState = 'disconnected';
  private channels = new Set<string>();
  private eventSinks = new Set<EventSink>();
  private stateListeners = new Set<StateListener>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private pongTimer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private beforeUnload: (() => void) | null = null;
  private config: ConnectionConfig;

  constructor(config: ConnectionConfig) {
    this.config = config;
  }

  /** Idempotent — starts the connection on first call. */
  ensureStarted() {
    if (this.started) return;
    this.started = true;
    const url = this.config.wsUrl()?.trim();
    if (!url || this.config.maxRetries <= 0) {
      log(url ? 'WS disabled (maxRetries=0), polling mode' : 'no WS URL, polling mode');
      this.setState('polling');
      return;
    }
    this.beforeUnload = () => this.closeGracefully();
    window.addEventListener('beforeunload', this.beforeUnload);
    this.doConnect();
  }

  disconnect() {
    this.removeBeforeUnload();
    this.stopPing();
    this.stopReconnect();
    this.closeGracefully();
    this.setState('disconnected');
    this.started = false;
    this.reconnectAttempt = 0;
    this.channels.clear();
  }

  getState(): ConnectionState {
    return this.state;
  }

  subscribe(channel: string) {
    this.channels.add(channel);
    if (this.state === 'connected' && this.ws) {
      log('subscribe', channel);
      this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
    } else {
      log('subscribe (queued until connect)', channel);
    }
  }

  unsubscribe(channel: string) {
    this.channels.delete(channel);
    if (this.state === 'connected' && this.ws) {
      log('unsubscribe', channel);
      this.ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
    }
  }

  /**
   * Sends a raw message frame, for bidirectional features (collaborative
   * editing). Best-effort: drops the frame when the socket isn't connected —
   * these payloads are ephemeral, so there's nothing to queue or replay.
   */
  send(payload: object): boolean {
    if (this.state === 'connected' && this.ws) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  onEvent(sink: EventSink): () => void {
    this.eventSinks.add(sink);
    return () => this.eventSinks.delete(sink);
  }

  onStateChange(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  // ── internal ──

  private setState(next: ConnectionState) {
    if (next === this.state) return;
    const prev = this.state;
    this.state = next;
    for (const l of this.stateListeners) l(next, prev);
  }

  private doConnect() {
    const token = this.config.authToken();
    const url = this.config.wsUrl()?.trim();
    if (!token || !url) {
      this.fallbackToPolling();
      return;
    }
    this.setState('connecting');
    this.ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);

    this.ws.onopen = () => {
      log('connected', url);
      this.reconnectAttempt = 0;
      this.startPing();
      this.resubscribeAll();
      this.setState('connected');
    };
    this.ws.onmessage = (e) => this.handleMessage(e.data as string);
    this.ws.onclose = (e) => {
      log('closed', e.code);
      this.stopPing();
      this.setState('disconnected');
      this.attemptReconnect();
    };
    this.ws.onerror = () => log('error');
  }

  private handleMessage(raw: string) {
    try {
      const msg = JSON.parse(raw) as {
        type: string;
        channel?: string;
        event?: string;
        data?: Record<string, unknown>;
        events?: Array<{ channel?: string; event?: string; data?: Record<string, unknown> }>;
      };
      if (msg.type === 'pong') {
        this.clearPong();
        return;
      }
      if (msg.type === 'subscribed' || msg.type === 'unsubscribed' || msg.type === 'error') {
        log(msg.type, msg.channel ?? '');
        return;
      }
      if (msg.type === 'event' && msg.channel && msg.event) {
        const event: LiveEvent = { channel: msg.channel, event: msg.event, data: msg.data ?? {} };
        for (const sink of this.eventSinks) sink(event);
      }
      // Server coalesces dispatch bursts into batch frames (~250ms windows).
      if (msg.type === 'eventBatch' && Array.isArray(msg.events)) {
        for (const item of msg.events) {
          if (!item?.channel || !item?.event) continue;
          const event: LiveEvent = { channel: item.channel, event: item.event, data: item.data ?? {} };
          for (const sink of this.eventSinks) sink(event);
        }
      }
    } catch {
      // ignore malformed frames
    }
  }

  private startPing() {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.state !== 'connected' || !this.ws) return;
      this.ws.send('{"type":"ping"}');
      // Never re-arm while a pong is outstanding — reassigning would orphan
      // the pending timer, which could then close a healthy socket after its
      // pong had already arrived. The kept timer still enforces the deadline.
      if (this.pongTimer) return;
      this.pongTimer = setTimeout(() => {
        this.pongTimer = null;
        log('pong timeout, closing');
        this.ws?.close();
      }, PONG_TIMEOUT_MS);
    }, PING_INTERVAL_MS);
  }

  private stopPing() {
    if (this.pingTimer) { clearInterval(this.pingTimer); this.pingTimer = null; }
    this.clearPong();
  }

  private clearPong() {
    if (this.pongTimer) { clearTimeout(this.pongTimer); this.pongTimer = null; }
  }

  private attemptReconnect() {
    if (this.reconnectAttempt >= this.config.maxRetries) {
      this.fallbackToPolling();
      return;
    }
    const delay = RECONNECT_DELAYS[this.reconnectAttempt] ?? MAX_RECONNECT_DELAY_MS;
    this.reconnectAttempt++;
    log(`reconnect ${this.reconnectAttempt}/${this.config.maxRetries} in ${delay}ms`);
    this.reconnectTimer = setTimeout(() => this.doConnect(), delay);
  }

  private stopReconnect() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
  }

  private fallbackToPolling() {
    log('falling back to polling');
    this.ws = null;
    this.setState('polling');
  }

  private resubscribeAll() {
    if (!this.ws) return;
    for (const channel of this.channels) {
      this.ws.send(JSON.stringify({ type: 'subscribe', channel }));
    }
  }

  private closeGracefully() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close(1000, 'client disconnect');
      this.ws = null;
    }
  }

  private removeBeforeUnload() {
    if (this.beforeUnload) {
      window.removeEventListener('beforeunload', this.beforeUnload);
      this.beforeUnload = null;
    }
  }
}

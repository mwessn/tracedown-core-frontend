/**
 * Poll scheduler — coalesces all due polls into bulk requests.
 *
 * Each entry keeps its own cadence (`nextDueAt`). A single timer fires at the
 * earliest due time; on fire, every entry due within COALESCE_WINDOW_MS is
 * drained into one bulk round-trip. So per-channel frequency is respected, and
 * polls that happen to fall due together travel as one request.
 *
 * Polling is armed only while the connection is in fallback (`polling`) state;
 * a healthy WS drives updates via deltas instead. `resync` does a one-shot
 * catch-up flush (used after a reconnect). Polling pauses on a hidden tab.
 */

import type { Bulk } from '@/requests/bulk';
import type { BulkSubRequest } from '@/requests/types';

const COALESCE_WINDOW_MS = 50;
const MAX_BULK_SIZE = 50;

export interface PollEntry {
  identity: string;
  pollUrl: string;
  pollFreqMs: number;
  /** Applies a successful poll body to the entry's shared state. */
  apply: (body: unknown) => void;
  nextDueAt: number;
}

export class PollScheduler<Code extends string> {
  private entries = new Map<string, PollEntry>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private polling = false;
  private paused = false;
  private bulk: Bulk<Code>;

  constructor(bulk: Bulk<Code>) {
    this.bulk = bulk;
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
    }
  }

  add(entry: Omit<PollEntry, 'nextDueAt'>) {
    const now = Date.now();
    this.entries.set(entry.identity, { ...entry, nextDueAt: now + entry.pollFreqMs });
    if (this.polling) this.reschedule();
  }

  remove(identity: string) {
    this.entries.delete(identity);
    if (this.entries.size === 0) this.clearTimer();
  }

  /** Arms or disarms regular polling (follows the connection state). */
  setPolling(on: boolean) {
    if (this.polling === on) return;
    this.polling = on;
    if (on) {
      const now = Date.now();
      for (const e of this.entries.values()) e.nextDueAt = now + e.pollFreqMs;
      this.reschedule();
    } else {
      this.clearTimer();
    }
  }

  /** One-shot catch-up flush (e.g. after WS reconnect), respecting cadence after. */
  resync(identities?: string[]) {
    const targets = identities
      ? identities.map((id) => this.entries.get(id)).filter((e): e is PollEntry => !!e)
      : [...this.entries.values()];
    if (targets.length) void this.flush(targets);
  }

  dispose() {
    this.clearTimer();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility);
    }
  }

  // ── internal ──

  private onVisibility = () => {
    if (document.hidden) {
      this.paused = true;
      this.clearTimer();
    } else {
      this.paused = false;
      if (this.polling) {
        this.resync();
        this.reschedule();
      }
    }
  };

  private reschedule() {
    this.clearTimer();
    if (!this.polling || this.paused || this.entries.size === 0) return;
    const now = Date.now();
    let earliest = Infinity;
    for (const e of this.entries.values()) earliest = Math.min(earliest, e.nextDueAt);
    this.timer = setTimeout(() => this.tick(), Math.max(0, earliest - now));
  }

  private tick() {
    const now = Date.now();
    const due = [...this.entries.values()].filter((e) => e.nextDueAt <= now + COALESCE_WINDOW_MS);
    if (due.length) {
      for (const e of due) e.nextDueAt = now + e.pollFreqMs;
      void this.flush(due);
    }
    this.reschedule();
  }

  private async flush(entries: PollEntry[]) {
    for (let i = 0; i < entries.length; i += MAX_BULK_SIZE) {
      const chunk = entries.slice(i, i + MAX_BULK_SIZE);
      const requests: BulkSubRequest[] = chunk.map((e) => ({ method: 'get', url: e.pollUrl }));
      const res = await this.bulk(requests, { disableLoading: true });
      if (!res.success || !res.data) continue;
      for (const call of res.data.calls) {
        const entry = chunk[call.index];
        if (entry && call.response.status >= 200 && call.response.status < 300) {
          entry.apply(call.response.body);
        }
      }
    }
  }

  private clearTimer() {
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }
}

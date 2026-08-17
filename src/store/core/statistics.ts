import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type { ServiceStatistics } from '@/data/metrics/MetricsDto';
import type { ActionResult } from '@/types/actions';

/** Windows the statistics endpoint accepts (short → hourly buckets, long → daily). */
export type StatWindow = '24h' | '7d' | '30d' | '90d';

/**
 * Deep per-service statistics read from `probe_aggregates`: the overall
 * uptime/error-rate/latency trend plus a per-region breakdown, over a selectable
 * window. Kept separate from the workspace/project header roll-up store.
 */
export const useStatisticsStore = defineStore('statistics', () => {
  const stats = ref<ServiceStatistics | null>(null);
  const loading = ref<boolean>(false);
  const key = ref<string | null>(null);

  /** Monotonic fetch generation — a superseded response is discarded on arrival. */
  let generation = 0;

  /** Loads statistics for a service + window. Repeat calls for the same key are free. */
  async function fetchStatistics(serviceId: string, window: StatWindow, force = false): Promise<ActionResult> {
    const nextKey = `${serviceId}:${window}`;
    if (!force && key.value === nextKey && stats.value) return { ok: true };
    // A different service/window — drop the previous charts before loading so
    // another resource's tab never renders them while its own fetch runs.
    if (key.value !== nextKey) {
      stats.value = null;
      key.value = null;
    }
    const gen = ++generation;
    loading.value = true;
    try {
      const res = await http.get<ServiceStatistics>(
        `/services/${serviceId}/metrics/statistics?window=${window}`,
        { disableLoading: true },
      );
      // A newer fetch superseded this one — never overwrite fresher data.
      if (gen !== generation) return { ok: true };
      if (!res.success || !res.data) {
        // Deliberately not cached as loaded — a revisit retries the fetch.
        return { ok: false, message: res.errorInfo?.message };
      }
      stats.value = res.data;
      key.value = nextKey;
      return { ok: true };
    } finally {
      if (gen === generation) loading.value = false;
    }
  }

  /** Drops cached state (on navigation away from a service). */
  function clear(): void {
    stats.value = null;
    key.value = null;
  }

  return { stats, loading, fetchStatistics, clear };
});

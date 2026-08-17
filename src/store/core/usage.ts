import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type { UsageResponse, UsageScope } from '@/data/usage/UsageDto';
import type { ActionResult } from '@/types/actions';

/**
 * Resource usage (requests + measured ingress/egress bytes) over a window.
 * Read-only, on-demand: the Usage tab fetches for its scope + selected period.
 */
export const useUsageStore = defineStore('usage', () => {
  const usage = ref<UsageResponse | null>(null);
  const loading = ref<boolean>(false);

  function path(scope: UsageScope, resourceId: string, hours: number): string {
    const query = `?hours=${hours}`;
    return scope === 'org' ? `/org/usage${query}` : `/${scope}/${resourceId}/usage${query}`;
  }

  async function fetchUsage(scope: UsageScope, resourceId: string, hours: number): Promise<ActionResult> {
    loading.value = true;
    try {
      const res = await http.get<UsageResponse>(path(scope, resourceId, hours));
      if (!res.success || !res.data) {
        return { ok: false, message: res.errorInfo?.message };
      }
      usage.value = res.data;
      return { ok: true };
    } finally {
      loading.value = false;
    }
  }

  function clear() {
    usage.value = null;
  }

  return { usage, loading, fetchUsage, clear };
});

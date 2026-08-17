import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type { SystemAlertSummary } from '@/data/alerts/SystemAlertDto';
import type { ActionDataResult, ActionResult } from '@/types/actions';
import type { Page } from '@/types/pfs';

/**
 * Platform-raised system alerts shown as dismissable banners to org admins
 * (settings write access — others get a 403 and simply see no banners).
 */
export const useSystemAlertStore = defineStore('systemAlert', () => {
  const alerts = ref<SystemAlertSummary[]>([]);
  /** Set by session-bulk seeding; consumed once by the org shell mount. */
  let seeded = false;

  /** Session-bulk seeding — spares the shell a mount-time round-trip. */
  function seed(items: SystemAlertSummary[]) {
    alerts.value = items;
    seeded = true;
  }

  /** True exactly once after a seed — the shell skips its initial fetch. */
  function consumeSeed(): boolean {
    const wasSeeded = seeded;
    seeded = false;
    return wasSeeded;
  }

  async function fetchAlerts(): Promise<void> {
    const res = await http.get<SystemAlertSummary[]>('/system-alerts', { disableLoading: true });
    alerts.value = res.success && res.data ? res.data : [];
  }

  async function dismiss(alertId: string): Promise<ActionResult> {
    // Optimistic — the banner disappears immediately.
    alerts.value = alerts.value.filter(a => a.id !== alertId);
    const res = await http.post<{ ok: boolean }, Record<string, never>>(`/system-alerts/${alertId}/dismiss`, {},);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true };
  }

  /** Full episode history (warning log) — state lives with the view. */
  async function fetchHistory(page: number, pageSize = 50): Promise<ActionDataResult<Page<SystemAlertSummary>>> {
    const res = await http.get<Page<SystemAlertSummary>>(`/system-alerts/history?page=${page}&pageSize=${pageSize}`, { disableLoading: true },);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true, data: res.data };
  }

  function clear() {
    alerts.value = [];
  }

  return { alerts, seed, consumeSeed, fetchAlerts, fetchHistory, dismiss, clear };
});

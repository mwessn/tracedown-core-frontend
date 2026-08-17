import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type { RevokedCount, SessionSummary } from '@/data/auth/SessionDto';
import type { ActionResult } from '@/types/actions';
import type { Page } from '@/types/pfs';

/** Active login sessions for the current user: list, revoke one, revoke others. */
export const useSessionStore = defineStore('session', () => {
  const sessions = ref<SessionSummary[]>([]);
  const loading = ref<boolean>(false);

  async function fetchSessions(): Promise<ActionResult> {
    loading.value = true;
    try {
      const res = await http.get<Page<SessionSummary>>('/auth/sessions?pageSize=100');
      if (!res.success || !res.data) {
        return { ok: false, message: res.errorInfo?.message };
      }
      sessions.value = res.data.items;
      return { ok: true };
    } finally {
      loading.value = false;
    }
  }

  async function revokeSession(id: string): Promise<ActionResult> {
    const res = await http.delete<{ ok: boolean }>(`/auth/sessions/${id}`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    sessions.value = sessions.value.filter(s => s.id !== id);
    return { ok: true };
  }

  async function revokeOthers(): Promise<ActionResult> {
    const res = await http.delete<RevokedCount>('/auth/sessions');
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    sessions.value = sessions.value.filter(s => s.current);
    return { ok: true };
  }

  return { sessions, loading, fetchSessions, revokeSession, revokeOthers };
});

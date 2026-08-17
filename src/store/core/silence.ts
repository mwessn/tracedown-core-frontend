import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import { defaultPfsParams, pfsToQueryString } from '@/utils/pfs';
import type { Page } from '@/types/pfs';
import type { CreateSilenceRequest, SilenceSummary, UpdateSilenceRequest } from '@/data/silences/SilenceDto';
import type { GrantResourceType } from '@/data/orgs/PermissionDto';
import type { ActionResult } from '@/types/actions';

const SCOPE_FIELD = {
  workspace: 'workspaceId',
  project: 'projectId',
  service: 'serviceId',
} as const;

/**
 * The current user's notification silences. Loaded once (all bells share the
 * list); bell toggles create/delete a channel-wide silence scoped to one
 * resource. Quiet-hours rows (managed in account settings) are left alone.
 */
export const useSilenceStore = defineStore('silence', () => {
  const silences = ref<SilenceSummary[]>([]);
  let loadPromise: Promise<void> | null = null;

  /** Session-bulk seeding: bells' ensureLoaded becomes a no-op. */
  function seed(items: SilenceSummary[]) {
    silences.value = items;
    loadPromise = Promise.resolve();
  }

  function ensureLoaded(): Promise<void> {
    loadPromise ??= (async () => {
      const pfs = defaultPfsParams({ pageSize: 100 });
      const res = await http.get<Page<SilenceSummary>>(
        `/silences${pfsToQueryString(pfs, '?')}`,
        { disableLoading: true },
      );
      if (res.success && res.data) {
        silences.value = res.data.items;
      } else {
        loadPromise = null; // allow a retry on the next bell
      }
    })();
    return loadPromise;
  }

  /** The bell silence of one resource: channel `all`, exactly that scope. */
  function findScoped(resourceType: GrantResourceType, resourceId: string): SilenceSummary | undefined {
    return silences.value.find(s =>
      s.channel === 'all' && s[SCOPE_FIELD[resourceType]] === resourceId);
  }

  function isSilenced(resourceType: GrantResourceType, resourceId: string): boolean {
    return findScoped(resourceType, resourceId) !== undefined;
  }

  async function toggle(resourceType: GrantResourceType, resourceId: string): Promise<ActionResult> {
    await ensureLoaded();
    const existing = findScoped(resourceType, resourceId);

    if (existing) {
      const res = await http.delete<unknown>(`/silences/${existing.id}`);
      if (!res.success) {
        return { ok: false, message: res.errorInfo?.message };
      }
      silences.value = silences.value.filter(s => s.id !== existing.id);
      return { ok: true };
    }

    const res = await http.post<SilenceSummary, CreateSilenceRequest>('/silences', {
      channel: 'all',
      [SCOPE_FIELD[resourceType]]: resourceId,
    });
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    silences.value = [...silences.value, res.data];
    return { ok: true };
  }

  /** Patches one silence (channel/config/quietHours) in place. */
  async function update(silenceId: string, patch: UpdateSilenceRequest): Promise<ActionResult> {
    const res = await http.patch<SilenceSummary, UpdateSilenceRequest>(`/silences/${silenceId}`, patch);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    const updated = res.data;
    silences.value = silences.value.map(s => (s.id === silenceId ? updated : s));
    return { ok: true };
  }

  /** Removes a silence by id (the bell toggle removes by scope instead). */
  async function remove(silenceId: string): Promise<ActionResult> {
    const res = await http.delete<{ ok: boolean }>(`/silences/${silenceId}`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    silences.value = silences.value.filter(s => s.id !== silenceId);
    return { ok: true };
  }

  /** Creates a raw silence row (used by the quiet-hours carrier). */
  async function createRaw(request: CreateSilenceRequest): Promise<ActionResult> {
    const res = await http.post<SilenceSummary, CreateSilenceRequest>('/silences', request);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    silences.value = [...silences.value, res.data];
    return { ok: true };
  }

  function clear() {
    silences.value = [];
    loadPromise = null;
  }

  return { silences, seed, ensureLoaded, isSilenced, toggle, update, remove, createRaw, clear };
});

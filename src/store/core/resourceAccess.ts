import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type { GrantResourceType } from '@/data/orgs/PermissionDto';
import type { AccessPrincipalType, ResourceAccessEntry, UpsertAccessRequest } from '@/data/orgs/ResourceAccessDto';
import type { ActionResult, FetchOptions } from '@/types/actions';

/**
 * Resource-scoped access grants of the currently viewed resource ("users"
 * tab of a workspace / project / service). Keyed by resource; the tab always
 * shows the resource it's mounted on.
 */
export const useResourceAccessStore = defineStore('resourceAccess', () => {
  const entries = ref<ResourceAccessEntry[]>([]);
  const loading = ref<boolean>(false);
  const fetchedKey = ref<string | null>(null);

  /** Monotonic fetch generation — a superseded response is discarded on arrival. */
  let generation = 0;

  function keyOf(resourceType: GrantResourceType, resourceId: string): string {
    return `${resourceType}:${resourceId}`;
  }

  /** Synchronously drops another resource's grants before the first render. */
  function ensureContext(resourceType: GrantResourceType, resourceId: string) {
    if (fetchedKey.value !== null && fetchedKey.value !== keyOf(resourceType, resourceId)) {
      entries.value = [];
      fetchedKey.value = null;
    }
  }

  async function fetchAccess(
    resourceType: GrantResourceType,
    resourceId: string,
    opts: FetchOptions = {},
  ): Promise<ActionResult> {
    const key = keyOf(resourceType, resourceId);
    if (!opts.force && fetchedKey.value === key) {
      // Stale-while-revalidate, same as the other list stores.
      if (!opts.silent) void fetchAccess(resourceType, resourceId, { force: true, silent: true });
      return { ok: true };
    }
    ensureContext(resourceType, resourceId);
    const gen = ++generation;
    if (!opts.silent) loading.value = true;
    try {
      const res = await http.get<ResourceAccessEntry[]>(
        `/access/${resourceType}/${resourceId}`,
        { disableLoading: opts.silent },
      );
      // A newer fetch superseded this one — a slow stale response must not
      // overwrite fresher data.
      if (gen !== generation) return { ok: true };
      if (!res.success || !res.data) {
        return { ok: false, message: res.errorInfo?.message };
      }
      entries.value = res.data;
      fetchedKey.value = key;
      return { ok: true };
    } finally {
      if (!opts.silent) loading.value = false;
    }
  }

  /** Grants or updates one principal's level on the resource. */
  async function grant(
    resourceType: GrantResourceType,
    resourceId: string,
    request: UpsertAccessRequest,
  ): Promise<ActionResult> {
    const res = await http.put<{ ok: boolean }, UpsertAccessRequest>(
      `/access/${resourceType}/${resourceId}`,
      request,
    );
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    void fetchAccess(resourceType, resourceId, { force: true, silent: true });
    return { ok: true };
  }

  /** Revokes a principal's grant on the resource. */
  async function revoke(
    resourceType: GrantResourceType,
    resourceId: string,
    principalType: AccessPrincipalType,
    principalId: string,
  ): Promise<ActionResult> {
    const res = await http.delete<{ ok: boolean }>(
      `/access/${resourceType}/${resourceId}/${principalType}/${principalId}`,
    );
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    entries.value = entries.value.filter(e =>
      !(e.principalType === principalType && e.principalId === principalId));
    return { ok: true };
  }

  /** Live-sync hook: refetch silently when the viewed resource's grants change. */
  function refreshIfCurrent(resourceType: string, resourceId: string) {
    if (fetchedKey.value === `${resourceType}:${resourceId}`) {
      void fetchAccess(resourceType as GrantResourceType, resourceId, { force: true, silent: true });
    }
  }

  function clear() {
    entries.value = [];
    fetchedKey.value = null;
  }

  return { entries, loading, ensureContext, fetchAccess, grant, revoke, refreshIfCurrent, clear };
});

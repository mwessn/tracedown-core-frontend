import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type { Page } from '@/types/pfs';
import type {
  CreateVariableRequest,
  UpdateVariableRequest,
  VariableSummary,
} from '@/data/variables/VariableDto';
import type { ActionResult, FetchOptions } from '@/types/actions';

/**
 * Org-level variables (`/api/v1/org/variables`). Flat — the org is the root of
 * the scope chain, so there is no inheritance to show. Gated by the `settings`
 * permission. Distinct from the resource variable store (which is hierarchy-
 * centric and lives under `/{resourceType}/{id}/variables`); org reveal is a
 * plain GET on the item, not a `/reveal` sub-path.
 */
export const useOrgVariableStore = defineStore('orgVariable', () => {
  const variables = ref<VariableSummary[]>([]);
  const loading = ref<boolean>(false);
  const revealedValues = reactive(new Map<string, string>());
  const loaded = ref<boolean>(false);

  const BASE = '/org/variables';

  async function fetchVariables(opts: FetchOptions = {}): Promise<ActionResult> {
    if (!opts.force && loaded.value) return { ok: true };
    if (!opts.silent) loading.value = true;
    try {
      const res = await http.get<Page<VariableSummary>>(`${BASE}?pageSize=1000`, {
        disableLoading: opts.silent,
      });
      if (!res.success || !res.data) {
        return { ok: false, message: res.errorInfo?.message };
      }
      variables.value = res.data.items;
      revealedValues.clear();
      loaded.value = true;
      return { ok: true };
    } finally {
      // Only the fetch that showed the spinner may clear it — a concurrent
      // silent refresh must not wipe a non-silent fetch's loading state.
      if (!opts.silent) loading.value = false;
    }
  }

  async function createVariable(request: CreateVariableRequest): Promise<ActionResult> {
    const res = await http.post<VariableSummary, CreateVariableRequest>(BASE, request);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return fetchVariables({ force: true, silent: true });
  }

  async function updateVariable(variableId: string, request: UpdateVariableRequest): Promise<ActionResult> {
    const res = await http.patch<VariableSummary, UpdateVariableRequest>(`${BASE}/${variableId}`, request);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    revealedValues.delete(variableId);
    return fetchVariables({ force: true, silent: true });
  }

  async function deleteVariable(variableId: string): Promise<ActionResult> {
    const res = await http.delete(`${BASE}/${variableId}`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    revealedValues.delete(variableId);
    return fetchVariables({ force: true, silent: true });
  }

  async function revealVariable(variableId: string): Promise<ActionResult> {
    // Org reveal is a plain GET on the item (no `/reveal` sub-path).
    const res = await http.get<VariableSummary>(`${BASE}/${variableId}`);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    revealedValues.set(variableId, res.data.value);
    return { ok: true };
  }

  function hideValue(variableId: string) {
    revealedValues.delete(variableId);
  }

  function clear() {
    variables.value = [];
    revealedValues.clear();
    loaded.value = false;
  }

  return {
    variables, loading, revealedValues,
    fetchVariables, createVariable, updateVariable, deleteVariable,
    revealVariable, hideValue, clear,
  };
});

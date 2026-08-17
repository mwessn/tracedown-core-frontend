import { ref, reactive } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type {
  CreateVariableRequest,
  UpdateVariableRequest,
  VariableHierarchyResponse,
  VariableResourceType,
  VariableSummary,
} from '@/data/variables/VariableDto';
import type { ActionResult, FetchOptions } from '@/types/actions';

/**
 * Variables editor state, hierarchy-centric: a resource's editor shows its own
 * variables plus every inherited ancestor scope (read-only) and each scope's
 * locked computed variables. Mutations only ever target the editable resource;
 * ancestor changes arriving over the live channel refresh the whole hierarchy.
 */
export const useVariableStore = defineStore('variable', () => {
  const hierarchy = ref<VariableHierarchyResponse | null>(null);
  const loading = ref<boolean>(false);
  const revealedValues = reactive(new Map<string, string>());
  /** `resourceType:resourceId` of the editable (requested) resource. */
  const loadedKey = ref<string | null>(null);
  /** The editable resource whose scope owns all mutations. */
  const editableResource = ref<{ type: VariableResourceType; id: string } | null>(null);

  /** Monotonic fetch generation — a superseded response is discarded on arrival. */
  let generation = 0;

  function apiPrefix(resourceType: VariableResourceType, resourceId: string): string {
    return `/${resourceType}/${resourceId}/variables`;
  }

  async function fetchHierarchy(
    resourceType: VariableResourceType,
    resourceId: string,
    opts: FetchOptions = {},
  ): Promise<ActionResult> {
    const key = `${resourceType}:${resourceId}`;
    if (!opts.force && loadedKey.value === key) {
      return { ok: true };
    }
    const gen = ++generation;
    if (!opts.silent) loading.value = true;
    try {
      if (loadedKey.value !== key) {
        hierarchy.value = null;
        revealedValues.clear();
      }
      const res = await http.get<VariableHierarchyResponse>(
        `${apiPrefix(resourceType, resourceId)}/hierarchy`,
        { disableLoading: opts.silent },
      );
      // A newer fetch superseded this one — a slow stale response must not
      // overwrite fresher data or re-point the editable resource.
      if (gen !== generation) return { ok: true };
      if (!res.success || !res.data) {
        return { ok: false, message: res.errorInfo?.message };
      }
      hierarchy.value = res.data;
      loadedKey.value = key;
      editableResource.value = { type: resourceType, id: resourceId };
      return { ok: true };
    } finally {
      if (!opts.silent) loading.value = false;
    }
  }

  /** Refreshes the editable resource's hierarchy after a mutation. */
  function refreshEditable(): Promise<ActionResult> {
    const r = editableResource.value;
    if (!r) return Promise.resolve({ ok: true });
    return fetchHierarchy(r.type, r.id, { force: true, silent: true });
  }

  async function createVariable(
    resourceType: VariableResourceType,
    resourceId: string,
    request: CreateVariableRequest,
  ): Promise<ActionResult> {
    const res = await http.post<VariableSummary, CreateVariableRequest>(
      apiPrefix(resourceType, resourceId),
      request,
    );
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return refreshEditable();
  }

  async function updateVariable(
    resourceType: VariableResourceType,
    resourceId: string,
    variableId: string,
    request: UpdateVariableRequest,
  ): Promise<ActionResult> {
    const res = await http.patch<VariableSummary, UpdateVariableRequest>(
      `${apiPrefix(resourceType, resourceId)}/${variableId}`,
      request,
    );
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    revealedValues.delete(variableId);
    return refreshEditable();
  }

  async function deleteVariable(
    resourceType: VariableResourceType,
    resourceId: string,
    variableId: string,
  ): Promise<ActionResult> {
    const res = await http.delete(`${apiPrefix(resourceType, resourceId)}/${variableId}`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    revealedValues.delete(variableId);
    return refreshEditable();
  }

  async function revealVariable(
    resourceType: VariableResourceType,
    resourceId: string,
    variableId: string,
  ): Promise<ActionResult> {
    const res = await http.get<VariableSummary>(
      `${apiPrefix(resourceType, resourceId)}/${variableId}/reveal`,
    );
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    revealedValues.set(variableId, res.data.value);
    return { ok: true };
  }

  /**
   * Live-sync hook: refetches when the changed resource is any scope in the
   * loaded hierarchy — so an ancestor's variable edit refreshes the inherited
   * view too, not just changes to the resource being edited.
   */
  function refreshIfCurrent(_resourceType: VariableResourceType, resourceId: string) {
    const inScope = hierarchy.value?.scopes.some(s => s.resourceId === resourceId);
    if (inScope) void refreshEditable();
  }

  function hideValue(variableId: string) {
    revealedValues.delete(variableId);
  }

  function clear() {
    hierarchy.value = null;
    revealedValues.clear();
    loadedKey.value = null;
    editableResource.value = null;
  }

  return {
    hierarchy, loading, revealedValues,
    fetchHierarchy, createVariable, updateVariable, deleteVariable,
    revealVariable, refreshIfCurrent, hideValue, clear,
  };
});

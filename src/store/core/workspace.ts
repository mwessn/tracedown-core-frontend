import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type {
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
  WorkspaceListResponse,
  WorkspaceSummary,
} from '@/data/workspaces/WorkspaceDto';
import type { ActionDataResult, ActionResult, FetchOptions } from '@/types/actions';

export const useWorkspaceStore = defineStore('workspace', () => {
  const workspaces = ref<WorkspaceSummary[]>([]);
  const selectedWorkspaceId = ref<string | null>(null);

  const currentWorkspace = computed(() =>
    workspaces.value.find(w => w.id === selectedWorkspaceId.value) ?? null);

  const hasWorkspaces = computed(() => workspaces.value.length > 0);

  async function fetchWorkspaces(opts: FetchOptions = {}): Promise<ActionResult> {
    const res = await http.get<WorkspaceListResponse>('/workspaces', { disableLoading: opts.silent });
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    workspaces.value = res.data.items;
    return { ok: true };
  }

  /** Fetches a single workspace (direct URL navigation). A 404 redirects to resource-not-found. */
  async function fetchWorkspace(id: string): Promise<WorkspaceSummary | null> {
    const res = await http.get<WorkspaceSummary>(`/workspaces/${id}`, {
      redirectOnNotFound: true,
    });
    const ws = res.data ?? null;
    if (ws && !workspaces.value.find(w => w.id === ws.id)) {
      workspaces.value.push(ws);
    }
    return ws;
  }

  /** Populates workspaces from pre-fetched data (used by bulk init). */
  function setWorkspaces(data: WorkspaceListResponse) {
    workspaces.value = data.items;
  }

  function setSelectedWorkspace(id: string) {
    selectedWorkspaceId.value = id;
  }

  async function createWorkspace(request: CreateWorkspaceRequest): Promise<ActionDataResult<WorkspaceSummary>> {
    const res = await http.post<WorkspaceSummary, CreateWorkspaceRequest>('/workspaces', request);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    workspaces.value.push(res.data);
    return { ok: true, data: res.data };
  }

  async function renameWorkspace(id: string, name: string): Promise<ActionResult> {
    const res = await http.patch<WorkspaceSummary, UpdateWorkspaceRequest>(`/workspaces/${id}`, { name });
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    const ws = workspaces.value.find(w => w.id === id);
    if (ws) ws.name = name;
    return { ok: true };
  }

  async function deleteWorkspace(id: string): Promise<ActionResult> {
    const res = await http.delete(`/workspaces/${id}`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    workspaces.value = workspaces.value.filter(w => w.id !== id);
    if (selectedWorkspaceId.value === id) {
      selectedWorkspaceId.value = workspaces.value[0]?.id ?? null;
    }
    return { ok: true };
  }

  function clear() {
    workspaces.value = [];
    selectedWorkspaceId.value = null;
  }

  return {
    workspaces, selectedWorkspaceId, currentWorkspace, hasWorkspaces,
    fetchWorkspaces, fetchWorkspace, setWorkspaces, setSelectedWorkspace,
    createWorkspace, renameWorkspace, deleteWorkspace, clear,
  };
}, {
  persist: {
    pick: ['selectedWorkspaceId'],
  },
});

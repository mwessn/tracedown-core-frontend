import { reactive } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import { defaultPfsParams, pfsToQueryString } from '@/utils/pfs';
import type { Page } from '@/types/pfs';
import type { GrantResourceType } from '@/data/orgs/PermissionDto';
import type { ProjectSummary } from '@/data/projects/ProjectDto';
import type { ServiceSummary } from '@/data/services/ServiceDto';
import type { WorkspaceSummary } from '@/data/workspaces/WorkspaceDto';
import type { ActionDataResult } from '@/types/actions';
import type { SelectOption } from '@/types/ui/common';

const RESOURCE_PATHS: Record<GrantResourceType, string> = {
  workspace: 'workspaces',
  project: 'projects',
  service: 'services',
};

/**
 * Display-name resolution and pickers for resource-level permission grants.
 * Names are cached per `type:id`; components read `names` reactively and call
 * `ensure` for anything not yet resolved.
 */
export const useResourceNameStore = defineStore('resourceName', () => {
  const names = reactive(new Map<string, string>());
  const pending = new Set<string>();

  function keyOf(type: GrantResourceType, id: string): string {
    return `${type}:${id}`;
  }

  /** Triggers a lazy name fetch; the `names` map updates when it lands. */
  function ensure(type: GrantResourceType, id: string) {
    const key = keyOf(type, id);
    if (names.has(key) || pending.has(key)) return;
    pending.add(key);
    void http.get<{ name: string }>(`/${RESOURCE_PATHS[type]}/${id}`, { disableLoading: true })
      .then((res) => {
        pending.delete(key);
        if (res.success && res.data) {
          names.set(key, res.data.name);
        }
      });
  }

  function nameOf(type: GrantResourceType, id: string): string | undefined {
    return names.get(keyOf(type, id));
  }

  /** Picker options for the grant editor's cascading selects. */
  async function listWorkspaceOptions(): Promise<ActionDataResult<SelectOption[]>> {
    const res = await http.get<{ items: WorkspaceSummary[] }>('/workspaces');
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true, data: res.data.items.map(w => ({ value: w.id, label: w.name })) };
  }

  async function listProjectOptions(workspaceId: string): Promise<ActionDataResult<SelectOption[]>> {
    const pfs = defaultPfsParams();
    const res = await http.get<Page<ProjectSummary>>(
      `/projects?workspaceId=${workspaceId}${pfsToQueryString(pfs, '&')}`,
    );
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true, data: res.data.items.map(p => ({ value: p.id, label: p.name })) };
  }

  async function listServiceOptions(projectId: string): Promise<ActionDataResult<SelectOption[]>> {
    const pfs = defaultPfsParams();
    const res = await http.get<Page<ServiceSummary>>(
      `/services?projectId=${projectId}${pfsToQueryString(pfs, '&')}`,
    );
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true, data: res.data.items.map(s => ({ value: s.id, label: s.name })) };
  }

  return { names, ensure, nameOf, listWorkspaceOptions, listProjectOptions, listServiceOptions };
});

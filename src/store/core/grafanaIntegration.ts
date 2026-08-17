import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type {
  GrafanaIntegrationState, GrafanaIntegrationSummary, UpdateGrafanaIntegrationRequest,
} from '@/data/integrations/GrafanaDto';
import type { ServiceSummary } from '@/data/services/ServiceDto';
import type { ActionDataResult, ActionResult } from '@/types/actions';
import type { Page } from '@/types/pfs';

/**
 * Per-project Grafana integration (Prometheus scrape endpoint). State lives
 * with the consuming settings card — the store only wraps the API.
 */
export const useGrafanaIntegrationStore = defineStore('grafanaIntegration', () => {
  async function fetchIntegration(projectId: string): Promise<ActionDataResult<GrafanaIntegrationSummary | null>> {
    const res = await http.get<GrafanaIntegrationState>(`/projects/${projectId}/integrations/grafana`, { disableLoading: true });
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true, data: res.data.integration };
  }

  async function createIntegration(projectId: string): Promise<ActionDataResult<GrafanaIntegrationSummary>> {
    const res = await http.post<GrafanaIntegrationSummary, Record<string, never>>(`/projects/${projectId}/integrations/grafana`, {});
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true, data: res.data };
  }

  async function updateIntegration(
    projectId: string,
    request: UpdateGrafanaIntegrationRequest,
  ): Promise<ActionDataResult<GrafanaIntegrationSummary>> {
    const res = await http.patch<GrafanaIntegrationSummary, UpdateGrafanaIntegrationRequest>(`/projects/${projectId}/integrations/grafana`, request,);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true, data: res.data };
  }

  async function regenerateToken(projectId: string): Promise<ActionDataResult<GrafanaIntegrationSummary>> {
    const res = await http.post<GrafanaIntegrationSummary, Record<string, never>>(`/projects/${projectId}/integrations/grafana/regenerate-token`, {},);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true, data: res.data };
  }

  async function deleteIntegration(projectId: string): Promise<ActionResult> {
    const res = await http.delete<{ ok: boolean }>(`/projects/${projectId}/integrations/grafana`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true };
  }

  /** Project services for the scope picker (id + name only). */
  async function fetchServiceOptions(projectId: string): Promise<ActionDataResult<ServiceSummary[]>> {
    const res = await http.get<Page<ServiceSummary>>(`/services?projectId=${projectId}&pageSize=1000`, { disableLoading: true });
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true, data: res.data.items };
  }

  return {
    fetchIntegration,
    createIntegration,
    updateIntegration,
    regenerateToken,
    deleteIntegration,
    fetchServiceOptions,
  };
});

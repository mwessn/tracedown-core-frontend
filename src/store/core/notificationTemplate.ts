import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type {
  CreateNotificationTemplateRequest, NotificationTemplateSummary, UpdateNotificationTemplateRequest,
} from '@/data/notifications/NotificationTemplateDto';
import type { ProjectSummary } from '@/data/projects/ProjectDto';
import { defaultPfsParams, pfsToQueryString } from '@/utils/pfs';
import type { ActionResult } from '@/types/actions';
import type { Page } from '@/types/pfs';

/** Org notification templates + their project bindings. */
export const useNotificationTemplateStore = defineStore('notificationTemplate', () => {
  const templates = ref<NotificationTemplateSummary[]>([]);
  const total = ref<number>(0);
  const page = ref<number>(1);
  const loading = ref<boolean>(false);
  /** The last-used filter, so mutations can refetch the same slice. */
  let lastFilter: TemplateProjectFilter = null;

  async function fetchTemplates(
    pageNumber = 1,
    projectFilter: TemplateProjectFilter = lastFilter,
  ): Promise<ActionResult> {
    loading.value = true;
    lastFilter = projectFilter;
    try {
      const pfs = defaultPfsParams({
        page: pageNumber,
        sorters: [{ table: 'notification_templates', column: 'name', order: 'asc' }],
        filters: projectFilter === 'unbound'
          ? [{ table: 'project_notification_templates', column: 'project_id', operator: 'isNull', value: '' }]
          : projectFilter
            ? [{ table: 'project_notification_templates', column: 'project_id', operator: 'eq', value: projectFilter }]
            : [],
      });
      const res = await http.get<Page<NotificationTemplateSummary>>(
        `/notification-templates${pfsToQueryString(pfs)}`
      );
      if (!res.success || !res.data) {
        return { ok: false, message: res.errorInfo?.message };
      }
      templates.value = res.data.items;
      total.value = res.data.total;
      page.value = res.data.page;
      return { ok: true };
    } finally {
      loading.value = false;
    }
  }

  async function createTemplate(request: CreateNotificationTemplateRequest): Promise<ActionResult> {
    const res = await http.post<NotificationTemplateSummary, CreateNotificationTemplateRequest>('/notification-templates', request);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    void fetchTemplates(page.value);
    return { ok: true };
  }

  async function updateTemplate(id: string, request: UpdateNotificationTemplateRequest): Promise<ActionResult> {
    const res = await http.patch<NotificationTemplateSummary, UpdateNotificationTemplateRequest>(`/notification-templates/${id}`, request);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    const updated = res.data;
    templates.value = templates.value.map(t => (t.id === id ? updated : t));
    return { ok: true };
  }

  async function deleteTemplate(id: string): Promise<ActionResult> {
    const res = await http.delete<{ ok: boolean }>(`/notification-templates/${id}`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    void fetchTemplates(page.value);
    return { ok: true };
  }

  async function bindProject(templateId: string, projectId: string): Promise<ActionResult> {
    const res = await http.post<{ ok: boolean }, { projectId: string }>(`/notification-templates/${templateId}/projects`, { projectId });
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    templates.value = templates.value.map(t =>
      t.id === templateId ? { ...t, projectIds: [...t.projectIds, projectId] } : t);
    return { ok: true };
  }

  async function unbindProject(templateId: string, projectId: string): Promise<ActionResult> {
    const res = await http.delete<{ ok: boolean }>(
      `/notification-templates/${templateId}/projects/${projectId}`
    );
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    templates.value = templates.value.map(t =>
      t.id === templateId ? { ...t, projectIds: t.projectIds.filter(p => p !== projectId) } : t);
    return { ok: true };
  }

  /**
   * All projects across the org's workspaces, for the binding picker.
   * Templates bind org-wide, but project listing is workspace-scoped —
   * aggregate here.
   */
  async function fetchAllProjects(workspaceIds: string[]): Promise<ProjectSummary[]> {
    const pages = await Promise.all(workspaceIds.map(id =>
      http.get<Page<ProjectSummary>>(`/projects?workspaceId=${id}&pageSize=100`, { disableLoading: true })));
    return pages.flatMap(res => (res.success && res.data ? res.data.items : []));
  }

  return {
    templates, total, page, loading, fetchTemplates, createTemplate, updateTemplate, deleteTemplate,
    bindProject, unbindProject, fetchAllProjects,
  };
});

/** null = all, 'unbound' = no bindings, else a project id. */
type TemplateProjectFilter = string | null;

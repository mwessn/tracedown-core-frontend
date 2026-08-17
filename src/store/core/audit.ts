import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import { defaultPfsParams, pfsToQueryString } from '@/utils/pfs';
import type { AuditLogEntry } from '@/data/audit/AuditDto';
import type { ActionResult } from '@/types/actions';
import type { Page, PfsFilter } from '@/types/pfs';

interface AuditFilters {
  /** Substring match on the action name. */
  action?: string;
  entityType?: string;
  actorUserId?: string;
}

/** Org audit log — PFS-paginated, newest first. */
export const useAuditStore = defineStore('audit', () => {
  const entries = ref<AuditLogEntry[]>([]);
  const total = ref<number>(0);
  const page = ref<number>(1);
  const loading = ref<boolean>(false);
  let lastFilters: AuditFilters = {};

  async function fetchEntries(pageNumber = 1, filters: AuditFilters = lastFilters): Promise<ActionResult> {
    loading.value = true;
    lastFilters = filters;
    try {
      const pfsFilters: PfsFilter[] = [];
      if (filters.action?.trim()) {
        pfsFilters.push({
          table: 'org_audit_log', column: 'action', operator: 'like',
          value: filters.action.trim(), ignoreCase: true,
        });
      }
      if (filters.entityType) {
        pfsFilters.push({
          table: 'org_audit_log', column: 'entity_type', operator: 'eq', value: filters.entityType,
        });
      }
      if (filters.actorUserId) {
        pfsFilters.push({
          table: 'org_audit_log', column: 'user_id', operator: 'eq', value: filters.actorUserId,
        });
      }
      const pfs = defaultPfsParams({
        page: pageNumber,
        filters: pfsFilters,
        sorters: [{ table: 'org_audit_log', column: 'created_at', order: 'desc' }],
      });
      const res = await http.get<Page<AuditLogEntry>>(`/audit-log${pfsToQueryString(pfs)}`);
      if (!res.success || !res.data) {
        return { ok: false, message: res.errorInfo?.message };
      }
      entries.value = res.data.items;
      total.value = res.data.total;
      page.value = res.data.page;
      return { ok: true };
    } finally {
      loading.value = false;
    }
  }

  return { entries, total, page, loading, fetchEntries };
});

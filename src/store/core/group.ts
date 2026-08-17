import { ref } from 'vue';
import { defineStore } from 'pinia';
import { http } from '@/config/requests';
import type { Page } from '@/types/pfs';
import type { AddMemberRequest, CreateGroupRequest, GroupMember, GroupSummary, UpdateGroupRequest } from '@/data/orgs/GroupDto';
import type { OrgSectionPermissions, PermissionSet, UpdatePermissionsRequest } from '@/data/orgs/PermissionDto';
import type { ActionDataResult, ActionResult, FetchOptions } from '@/types/actions';

/** Org groups: CRUD, section permissions, and membership management. */
export const useGroupStore = defineStore('group', () => {
  const groups = ref<GroupSummary[]>([]);
  const totalGroups = ref<number>(0);
  const loading = ref<boolean>(false);
  const loaded = ref<boolean>(false);

  async function fetchGroups(opts: FetchOptions = {}): Promise<ActionResult> {
    if (!opts.force && loaded.value) {
      return { ok: true };
    }
    if (!opts.silent) loading.value = true;
    try {
      const res = await http.get<Page<GroupSummary>>('/groups', { disableLoading: opts.silent });
      if (!res.success || !res.data) {
        return { ok: false, message: res.errorInfo?.message };
      }
      groups.value = res.data.items;
      totalGroups.value = res.data.total;
      loaded.value = true;
      return { ok: true };
    } finally {
      // Only the fetch that showed the spinner may clear it — a concurrent
      // silent refresh must not wipe a non-silent fetch's loading state.
      if (!opts.silent) loading.value = false;
    }
  }

  async function createGroup(name: string): Promise<ActionDataResult<GroupSummary>> {
    const res = await http.post<GroupSummary, CreateGroupRequest>('/groups', { name });
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    groups.value.push(res.data);
    totalGroups.value++;
    return { ok: true, data: res.data };
  }

  async function renameGroup(groupId: string, name: string): Promise<ActionResult> {
    const res = await http.patch<GroupSummary, UpdateGroupRequest>(`/groups/${groupId}`, { name });
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    const group = groups.value.find(g => g.id === groupId);
    if (group) group.name = res.data.name;
    return { ok: true };
  }

  async function setTotpRequired(groupId: string, totpRequired: boolean): Promise<ActionResult> {
    const res = await http.patch<GroupSummary, UpdateGroupRequest>(`/groups/${groupId}`, { totpRequired });
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    const group = groups.value.find(g => g.id === groupId);
    if (group) group.totpRequired = res.data.totpRequired;
    return { ok: true };
  }

  async function deleteGroup(groupId: string): Promise<ActionResult> {
    const res = await http.delete(`/groups/${groupId}`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    groups.value = groups.value.filter(g => g.id !== groupId);
    totalGroups.value--;
    return { ok: true };
  }

  /** Updates a group's org-section levels; resource grants are left unchanged. */
  async function updateGroupPermissions(
    groupId: string,
    org: OrgSectionPermissions,
  ): Promise<ActionResult> {
    const res = await http.patch<PermissionSet, UpdatePermissionsRequest>(
      `/groups/${groupId}/permissions`,
      { org },
    );
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    const group = groups.value.find(g => g.id === groupId);
    if (group) {
      Object.assign(group, res.data.org);
    }
    return { ok: true };
  }

  async function fetchMembers(groupId: string): Promise<ActionDataResult<GroupMember[]>> {
    const res = await http.get<Page<GroupMember>>(`/groups/${groupId}/members`);
    if (!res.success || !res.data) {
      return { ok: false, message: res.errorInfo?.message };
    }
    return { ok: true, data: res.data.items };
  }

  async function addMember(groupId: string, userId: string): Promise<ActionResult> {
    const res = await http.post<{ ok: boolean }, AddMemberRequest>(
      `/groups/${groupId}/members`,
      { userId },
    );
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    bumpMemberCount(groupId, 1);
    return { ok: true };
  }

  async function removeMember(groupId: string, userId: string): Promise<ActionResult> {
    const res = await http.delete(`/groups/${groupId}/members/${userId}`);
    if (!res.success) {
      return { ok: false, message: res.errorInfo?.message };
    }
    bumpMemberCount(groupId, -1);
    return { ok: true };
  }

  /** Live-sync hook: silently refetches the list when already loaded. */
  function refreshGroups() {
    if (loaded.value) void fetchGroups({ force: true, silent: true });
  }

  function bumpMemberCount(groupId: string, delta: number) {
    const group = groups.value.find(g => g.id === groupId);
    if (group) group.memberCount = Math.max(0, group.memberCount + delta);
  }

  function clear() {
    groups.value = [];
    totalGroups.value = 0;
    loaded.value = false;
  }

  return {
    groups, totalGroups, loading,
    fetchGroups, refreshGroups, createGroup, renameGroup, setTotpRequired, deleteGroup, updateGroupPermissions,
    fetchMembers, addMember, removeMember, clear,
  };
});

<template>
    <PillPicker
      :title="t('groups.title')"
      :available="availableGroups"
      :assigned="memberGroups"
      :search-placeholder="t('groups.searchPlaceholder')"
      :add-title="t('groups.addMember')"
      :remove-title="t('groups.removeMember')"
      :all-assigned-text="t('groups.allAssigned')"
      :none-assigned-text="t('users.noGroups')"
      :visible-count="visibleCount"
      @add="toggle($event, true)"
      @remove="toggle($event, false)"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import PillPicker from '@/components/core/PillPicker.vue';
import { useGroupStore } from '@/store/core/group';
import { useOrgUserStore } from '@/store/core/orgUser';
import { useNotificationStore } from '@/store/ui/notifications';
import type { PillItem } from '@/types/ui/common';
/** The slice of a member the picker needs — active rows and pending invites both satisfy it. */
interface GroupMember {
  userId: string;
  groupIds: string[];
}

/** Group membership of one member as an assignment card. */
const props = withDefaults(
  defineProps<{
    user: GroupMember;
    visibleCount?: number;
  }>(),
  {
    visibleCount: 5,
  }
);

const { t } = useI18n();
const groupStore = useGroupStore();
const orgUserStore = useOrgUserStore();
const notifications = useNotificationStore();

const memberGroups = computed<PillItem[]>(() =>
  groupStore.groups
    .filter(g => props.user.groupIds.includes(g.id))
    .map(g => ({ id: g.id, label: g.name })));

const availableGroups = computed<PillItem[]>(() =>
  groupStore.groups
    .filter(g => !props.user.groupIds.includes(g.id))
    .map(g => ({ id: g.id, label: g.name })));

async function toggle(groupId: string, adding: boolean) {
  const result = adding
    ? await groupStore.addMember(groupId, props.user.userId)
    : await groupStore.removeMember(groupId, props.user.userId);
  if (!result.ok) {
    if (result.message) notifications.show(result.message, 'error');
    return;
  }
  orgUserStore.applyGroupMembership(props.user.userId, groupId, adding);
}
</script>

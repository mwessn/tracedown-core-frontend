<template>
    <ResourcePage
      :title="t('nav.users')"
      :tabs="tabs"
    >
      <template #members>
        <OrgUsersTab />
      </template>
      <template #groups>
        <GroupsTab />
      </template>
    </ResourcePage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { faUserGroup, faUsers } from '@fortawesome/free-solid-svg-icons';
import ResourcePage from '@/components/resource/ResourcePage.vue';
import OrgUsersTab from '@/components/users/members/OrgUsersTab.vue';
import GroupsTab from '@/components/users/groups/GroupsTab.vue';
import type { DisplayTab } from '@/types/ui/tabs';

/** Org user management: members (+ invites, permissions) and groups. */
const { t } = useI18n();

const tabs = computed<DisplayTab[]>(() => [
  { key: 'members', label: t('users.members'), icon: faUsers },
  { key: 'groups', label: t('groups.title'), icon: faUserGroup },
]);
</script>

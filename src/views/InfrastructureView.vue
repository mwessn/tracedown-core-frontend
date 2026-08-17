<template>
    <ResourcePage
      :title="t('nav.infrastructure')"
      :tabs="tabs"
    >
      <template #webhooks>
        <WebhooksView />
      </template>
      <template #notifications>
        <NotificationTemplatesView />
      </template>
      <template #orgVariables>
        <OrgVariablesTab />
      </template>
      <template #domains>
        <SettingsDomains />
      </template>
    </ResourcePage>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { faBell, faGlobe, faKey, faShareNodes } from '@fortawesome/free-solid-svg-icons';
import ResourcePage from '@/components/resource/ResourcePage.vue';
import WebhooksView from '@/views/WebhooksView.vue';
import NotificationTemplatesView from '@/views/NotificationTemplatesView.vue';
import OrgVariablesTab from '@/components/resource/variables/OrgVariablesTab.vue';
import SettingsDomains from '@/views/settings/SettingsDomains.vue';
import { useAuthStore } from '@/store/core/auth';
import type { DisplayTab } from '@/types/ui/tabs';

/**
 * DevOps infrastructure hub: webhook channels, notification templates, org
 * variables, and domains — each tab gated by its own permission. The tab list
 * is filtered to what the user can read so the first visible tab is the default.
 */
const { t } = useI18n();
const authStore = useAuthStore();

const tabs = computed<DisplayTab[]>(() => [
  { key: 'webhooks', label: t('nav.webhooks'), icon: faShareNodes, visible: authStore.canRead('webhooks') },
  { key: 'notifications', label: t('nav.notifications'), icon: faBell, visible: authStore.canRead('notifications') },
  { key: 'orgVariables', label: t('variables.orgTab'), icon: faKey, visible: authStore.canRead('settings') },
  // Hidden in trustedDomainMode — every domain auto-verifies, nothing to manage.
  { key: 'domains', label: t('nav.domains'), icon: faGlobe, visible: !authStore.trustedDomainMode && authStore.canRead('domains') },
].filter(tab => tab.visible));
</script>

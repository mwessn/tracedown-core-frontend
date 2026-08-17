<template>
    <DropdownPanel
      v-if="authStore.user"
      align-right
      panel-class="w-44"
    >
      <template #trigger="{ open, toggle }">
        <button
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
               text-text-primary hover:bg-background-primary transition-colors"
          @click="toggle"
        >
          {{ authStore.user.displayName }}
          <FontAwesomeIcon
            :icon="open ? faChevronDown : faChevronRight"
            class="w-2.5 h-2.5 text-text-secondary"
          />
        </button>
      </template>

      <template #default="{ close }">
        <router-link
          :to="{ name: 'account' }"
          class="flex items-center gap-2 w-full px-3 py-2 text-left text-sm
               text-text-primary hover:bg-background-primary/50 transition-colors"
          @click="close()"
        >
          <FontAwesomeIcon :icon="faUser" class="w-3.5 h-3.5 text-text-secondary" />
          {{ t('nav.account') }}
        </router-link>
        <button
          class="flex items-center gap-2 w-full px-3 py-2 text-left text-sm
               text-text-primary hover:bg-background-primary/50 transition-colors"
          @click="handleLogout"
        >
          <FontAwesomeIcon :icon="faArrowRightFromBracket" class="w-3.5 h-3.5 text-text-secondary" />
          {{ t('common.actions.logout') }}
        </button>
      </template>
    </DropdownPanel>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import {
  faArrowRightFromBracket, faChevronDown, faChevronRight, faUser,
} from '@fortawesome/free-solid-svg-icons';
import DropdownPanel from '@/components/core/DropdownPanel.vue';
import { useAuthStore } from '@/store/core/auth';
import { useOrgStore } from '@/store/core/org';
import { useWorkspaceStore } from '@/store/core/workspace';

const { t } = useI18n();
const router = useRouter();
const authStore = useAuthStore();
const orgStore = useOrgStore();
const workspaceStore = useWorkspaceStore();

function handleLogout() {
  authStore.logout();
  orgStore.clear();
  workspaceStore.clear();
  void router.push({ name: 'login' });
}
</script>

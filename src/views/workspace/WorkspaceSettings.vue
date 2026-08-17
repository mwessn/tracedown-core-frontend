<template>
    <div class="px-gutter py-6">
      <SettingsTab
        :resource-name="workspaceName"
        :can-edit="authStore.canWriteScoped([`workspace::${workspaceId}`])"
        :on-rename="rename"
        :on-delete="remove"
        resource-type="workspace"
        :resource-id="workspaceId"
      />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SettingsTab from '@/components/resource/SettingsTab.vue';
import { useAuthStore } from '@/store/core/auth';
import { useWorkspaceStore } from '@/store/core/workspace';
import type { ActionResult } from '@/types/actions';

const route = useRoute();
const authStore = useAuthStore();
const workspaceStore = useWorkspaceStore();

const workspaceId = computed(() => route.params.workspaceId as string);
const workspaceName = computed(() =>
  workspaceStore.workspaces.find(w => w.id === workspaceId.value)?.name ?? '');

function rename(name: string): Promise<ActionResult> {
  return workspaceStore.renameWorkspace(workspaceId.value, name);
}

function remove(): Promise<ActionResult> {
  return workspaceStore.deleteWorkspace(workspaceId.value);
}
</script>

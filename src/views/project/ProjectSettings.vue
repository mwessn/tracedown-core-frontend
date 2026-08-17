<template>
    <div class="px-gutter py-6">
      <SettingsTab
        :resource-name="projectName"
        :can-edit="canEdit"
        :on-rename="rename"
        :on-delete="remove"
        resource-type="project"
        :resource-id="projectId"
      />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SettingsTab from '@/components/resource/SettingsTab.vue';
import { useAuthStore } from '@/store/core/auth';
import { useProjectStore } from '@/store/core/project';
import type { ActionResult } from '@/types/actions';

const route = useRoute();
const authStore = useAuthStore();
const projectStore = useProjectStore();

const projectId = computed(() => route.params.projectId as string);
const projectName = computed(() =>
  projectStore.projects.find(p => p.id === projectId.value)?.name ?? '');

/** Write via org section, ownership, or a grant on the project/workspace. */
const canEdit = computed(() => {
  const project = projectStore.projects.find(p => p.id === projectId.value);
  return authStore.canWriteScoped([
    `project::${projectId.value}`,
    ...(project ? [`workspace::${project.workspaceId}`] : []),
  ]);
});

function rename(name: string): Promise<ActionResult> {
  return projectStore.renameProject(projectId.value, name);
}

function remove(): Promise<ActionResult> {
  return projectStore.deleteProject(projectId.value);
}
</script>

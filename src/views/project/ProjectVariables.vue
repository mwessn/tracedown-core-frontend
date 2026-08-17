<template>
    <div class="px-gutter py-6">
      <VariablesTab
        resource-type="projects"
        :resource-id="projectId"
        :can-edit="canEdit"
      />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import VariablesTab from '@/components/resource/variables/VariablesTab.vue';
import { useAuthStore } from '@/store/core/auth';
import { useProjectStore } from '@/store/core/project';

const route = useRoute();
const authStore = useAuthStore();
const projectStore = useProjectStore();

const projectId = computed(() => route.params.projectId as string);

/** Write via org section, ownership, or a grant on the project/workspace. */
const canEdit = computed(() => {
  const project = projectStore.projects.find(p => p.id === projectId.value);
  return authStore.canWriteScoped([
    `project::${projectId.value}`,
    ...(project ? [`workspace::${project.workspaceId}`] : []),
  ]);
});
</script>

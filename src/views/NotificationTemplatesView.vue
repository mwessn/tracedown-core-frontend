<template>
    <div class="px-gutter py-4 space-y-8">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <SectionHeading :label="t('settings.notificationTemplates')" />
          <CreateToggleButton
            v-if="canManage"
            v-model="createOpen"
            :label-text="t('templates.create')"
          />
        </div>
        <p class="text-sm text-text-secondary max-w-2xl">
          {{ t('templates.pageHint') }}
        </p>

        <div
          v-if="createOpen"
          class="max-w-2xl"
        >
          <form
            v-if="createOpen"
            class="space-y-3"
            @submit.prevent="handleCreate"
          >
            <div>
              <p class="text-xs text-text-secondary mb-1">
                {{ t('templates.name') }}
              </p>
              <TextInput
                v-model="newName"
                class="w-64"
                compact
                :placeholder="t('templates.namePlaceholder')"
              />
            </div>
            <div>
              <p class="text-xs text-text-secondary mb-1">
                {{ t('templates.text') }}
              </p>
              <TextArea
                v-model="newText"
                :rows="3"
                :placeholder="t('templates.textPlaceholder')"
              />
              <p class="text-xs text-text-secondary mt-1">
                {{ t('templates.varsHint') }}
              </p>
            </div>
            <PrimaryButton
              type="submit"
              :label-text="t('common.actions.create')"
              :loading="creating"
              :disabled="!newName.trim() || !newText.trim()"
            />
          </form>
        </div>

        <div class="flex items-end gap-2">
          <div>
            <p class="text-xs text-text-secondary mb-1">
              {{ t('templates.filterByProject') }}
            </p>
            <AppSelect
              v-model="projectFilter"
              class="w-64"
              searchable
              :options="filterOptions"
            />
          </div>
        </div>

        <LoadingState v-if="templateStore.loading && templateStore.templates.length === 0" />
        <EmptyState
          v-else-if="filteredTemplates.length === 0"
          compact
          :message="t('templates.none')"
        />
        <table
          v-else
          class="w-full table-fixed max-w-4xl"
        >
          <thead>
            <tr class="border-b border-text-secondary/50">
              <th class="text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3 w-44">
                {{ t('templates.name') }}
              </th>
              <th class="text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3">
                {{ t('templates.text') }}
              </th>
              <th class="text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3 w-64">
                {{ t('templates.boundProjects') }}
              </th>
              <th class="w-20" />
            </tr>
          </thead>
          <tbody>
            <NotificationTemplateRow
              v-for="template in filteredTemplates"
              :key="template.id"
              :template="template"
              :expanded="expandedId === template.id"
              :can-manage="canManage"
              :projects="projects"
              @toggle="expandedId = expandedId === template.id ? null : template.id"
              @bind="(projectId: string) => handleBind(template.id, projectId)"
              @unbind="(projectId: string) => handleUnbind(template.id, projectId)"
            />
          </tbody>
        </table>

        <TablePager
          :page="templateStore.page"
          :page-size="50"
          :total="templateStore.total"
          @change="(p: number) => templateStore.fetchTemplates(p)"
        />
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SectionHeading from '@/components/core/SectionHeading.vue';
import LoadingState from '@/components/core/LoadingState.vue';
import EmptyState from '@/components/core/EmptyState.vue';
import CreateToggleButton from '@/components/core/buttons/CreateToggleButton.vue';
import PrimaryButton from '@/components/core/buttons/PrimaryButton.vue';
import TextInput from '@/components/core/input/TextInput.vue';
import TextArea from '@/components/core/input/TextArea.vue';
import AppSelect from '@/components/core/input/AppSelect.vue';
import TablePager from '@/components/core/TablePager.vue';
import NotificationTemplateRow from '@/components/settings/NotificationTemplateRow.vue';
import { useNotificationTemplateStore } from '@/store/core/notificationTemplate';
import { useWorkspaceStore } from '@/store/core/workspace';
import { useAuthStore } from '@/store/core/auth';
import { useNotificationStore } from '@/store/ui/notifications';
import type { ProjectSummary } from '@/data/projects/ProjectDto';
import type { SelectOption } from '@/types/ui/common';

/**
 * Org notification templates: the ${var} texts referenced by Lace scripts
 * as template("name"). Bindings control which projects see each template.
 * Gated by the org-level `notifications` permission section.
 */
const { t } = useI18n();
const templateStore = useNotificationTemplateStore();
const workspaceStore = useWorkspaceStore();
const authStore = useAuthStore();
const notifications = useNotificationStore();

const canManage = computed(() => authStore.canWrite('notifications'));

const expandedId = ref<string | null>(null);
const projectFilter = ref<string>('');

const filterOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('templates.allProjects') },
  { value: 'unbound', label: t('templates.unboundOnly') },
  ...projects.value.map(p => ({ value: p.id, label: p.name })),
]);

// Server-side (PFS) filtering — re-query on change.
watch(projectFilter, (value) => {
  void templateStore.fetchTemplates(1, value || null);
});

const filteredTemplates = computed(() => templateStore.templates);
const createOpen = ref<boolean>(false);
const newName = ref<string>('');
const newText = ref<string>('');
const creating = ref<boolean>(false);
const projects = ref<ProjectSummary[]>([]);

async function handleCreate() {
  if (creating.value) return;
  creating.value = true;
  try {
    const result = await templateStore.createTemplate({
      name: newName.value.trim(),
      text: newText.value.trim(),
    });
    if (!result.ok) {
      notifications.show(result.message ?? t('common.states.error'), 'error');
      return;
    }
    newName.value = '';
    newText.value = '';
    createOpen.value = false;
  } finally {
    creating.value = false;
  }
}

async function handleBind(templateId: string, projectId: string) {
  const result = await templateStore.bindProject(templateId, projectId);
  if (!result.ok && result.message) notifications.show(result.message, 'error');
}

async function handleUnbind(templateId: string, projectId: string) {
  const result = await templateStore.unbindProject(templateId, projectId);
  if (!result.ok && result.message) notifications.show(result.message, 'error');
}

onMounted(async () => {
  // Fetch with this component's filter explicitly — the store remembers the
  // last filter app-lifetime, but the dropdown resets on remount and the two
  // must never disagree.
  void templateStore.fetchTemplates(1, projectFilter.value || null);
  if (workspaceStore.workspaces.length === 0) {
    await workspaceStore.fetchWorkspaces();
  }
  projects.value = await templateStore.fetchAllProjects(
    workspaceStore.workspaces.map(w => w.id)
  );
});
</script>

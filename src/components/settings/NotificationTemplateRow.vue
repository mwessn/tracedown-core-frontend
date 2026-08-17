<template>
    <tr class="border-b border-text-secondary/15">
      <td class="py-2 px-3 align-top">
        <p class="text-sm text-text-primary truncate">
          {{ template.name }}
        </p>
      </td>
      <td class="py-2 px-3 align-top">
        <p class="text-xs text-text-secondary font-mono truncate">
          {{ template.text }}
        </p>
      </td>
      <td class="py-2 px-3 align-top">
        <div class="flex flex-wrap gap-1">
          <BadgePill
            v-for="projectName in projectNames.slice(0, 3)"
            :key="projectName"
            color-class="bg-text-secondary/10 text-text-secondary"
            :label="projectName"
          />
          <BadgePill
            v-if="projectNames.length > 3"
            color-class="bg-text-secondary/10 text-text-secondary"
            :label="`+${projectNames.length - 3}`"
          />
          <span
            v-if="projectNames.length === 0"
            class="text-xs text-text-secondary italic"
          >
            {{ t('templates.noneBoundShort') }}
          </span>
        </div>
      </td>
      <td class="py-2 px-3 align-top w-20">
        <div
          v-if="canManage"
          class="flex items-center gap-1 justify-end"
        >
          <IconButton
            :fa-icon="faPen"
            :title="t('common.actions.edit')"
            color-class="text-text-secondary hover:text-accent-primary"
            icon-class="w-3.5 h-3.5"
            @click="emit('toggle')"
          />
          <IconButton
            :fa-icon="faTrash"
            :title="t('common.actions.delete')"
            color-class="text-text-secondary hover:text-status-failure"
            icon-class="w-3.5 h-3.5"
            :hold-offset-sec="3"
            @safe-click="handleDelete"
          />
        </div>
      </td>
    </tr>
    <tr v-if="expanded">
      <td
        colspan="4"
        class="pb-4 px-3"
      >
        <div class="space-y-4 max-w-2xl">
          <form
            class="space-y-3"
            @submit.prevent="handleSave"
          >
            <div>
              <p class="text-xs text-text-secondary mb-1">
                {{ t('templates.name') }}
              </p>
              <TextInput
                v-model="name"
                class="w-64"
                compact
              />
            </div>
            <div>
              <p class="text-xs text-text-secondary mb-1">
                {{ t('templates.text') }}
              </p>
              <TextArea
                v-model="text"
                :rows="3"
              />
              <p class="text-xs text-text-secondary mt-1">
                {{ t('templates.varsHint') }}
              </p>
            </div>
            <PrimaryButton
              type="submit"
              :label-text="t('common.actions.save')"
              :loading="saving"
              :disabled="!name.trim() || !text.trim()"
            />
          </form>

          <PillPicker
            :title="t('templates.boundProjects')"
            :available="availableProjects"
            :assigned="assignedProjects"
            :search-placeholder="t('templates.searchProjects')"
            :add-title="t('templates.bind')"
            :remove-title="t('templates.unbind')"
            :all-assigned-text="t('templates.allBound')"
            :none-assigned-text="t('templates.noneBound')"
            @add="(id: string) => emit('bind', id)"
            @remove="(id: string) => emit('unbind', id)"
          />
        </div>
      </td>
    </tr>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';
import BadgePill from '@/components/core/BadgePill.vue';
import IconButton from '@/components/core/buttons/IconButton.vue';
import PrimaryButton from '@/components/core/buttons/PrimaryButton.vue';
import TextInput from '@/components/core/input/TextInput.vue';
import TextArea from '@/components/core/input/TextArea.vue';
import PillPicker from '@/components/core/PillPicker.vue';
import { useNotificationTemplateStore } from '@/store/core/notificationTemplate';
import { useNotificationStore } from '@/store/ui/notifications';
import type { PillItem } from '@/types/ui/common';
import type { NotificationTemplateSummary } from '@/data/notifications/NotificationTemplateDto';
import type { ProjectSummary } from '@/data/projects/ProjectDto';

/** One template table row + its expandable edit/bindings row. */
const props = defineProps<{
  template: NotificationTemplateSummary;
  expanded: boolean;
  canManage: boolean;
  /** Org-wide project options for the binding picker. */
  projects: ProjectSummary[];
}>();

const emit = defineEmits<{
  toggle: [];
  bind: [projectId: string];
  unbind: [projectId: string];
}>();

const { t } = useI18n();
const templateStore = useNotificationTemplateStore();
const notifications = useNotificationStore();

const name = ref<string>(props.template.name);
const text = ref<string>(props.template.text);
const saving = ref<boolean>(false);

const projectNames = computed(() =>
  props.template.projectIds.map(id =>
    props.projects.find(p => p.id === id)?.name ?? id));

const availableProjects = computed<PillItem[]>(() => {
  const bound = new Set(props.template.projectIds);
  return props.projects
    .filter(p => !bound.has(p.id))
    .map(p => ({ id: p.id, label: p.name }));
});

const assignedProjects = computed<PillItem[]>(() =>
  props.template.projectIds.map(id => ({
    id,
    label: props.projects.find(p => p.id === id)?.name ?? id,
  })));

async function handleSave() {
  if (saving.value) return;
  saving.value = true;
  try {
    const result = await templateStore.updateTemplate(props.template.id, {
      name: name.value.trim(),
      text: text.value.trim(),
    });
    if (!result.ok) {
      notifications.show(result.message ?? t('common.states.error'), 'error');
      return;
    }
    emit('toggle');
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  const result = await templateStore.deleteTemplate(props.template.id);
  if (!result.ok && result.message) notifications.show(result.message, 'error');
}
</script>

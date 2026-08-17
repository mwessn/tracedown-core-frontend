<template>
    <div class="px-4 pb-4 space-y-6">
      <!-- Rename -->
      <InputActionRow
        v-if="canEdit"
        v-model="name"
        compact
        class="max-w-sm"
        :placeholder="t('groups.namePlaceholder')"
        :action-label="t('settings.rename')"
        :unchanged-value="group.name"
        @submit="rename"
      />

      <!-- Global section permissions -->
      <div class="max-w-sm">
        <SectionHeading class="mb-2" :label="t('permissions.title')" />
        <PermissionMatrix
          v-model="draft"
          :disabled="!canEdit"
        />
        <PrimaryButton
          v-if="canEdit"
          class="mt-3"
          :label-text="t('common.actions.save')"
          :loading="saving"
          :disabled="!isDirty"
          :on-click="savePermissions"
        />
      </div>

      <!-- Two-factor enforcement for this group's members -->
      <div
        v-if="canEdit"
        class="max-w-sm flex items-center justify-between gap-4"
      >
        <div>
          <p class="text-sm text-text-primary">
            {{ t('groups.totpRequired') }}
          </p>
          <p class="text-xs text-text-secondary">
            {{ t('groups.totpRequiredHint') }}
          </p>
        </div>
        <ToggleSwitch
          v-model="totpRequired"
          class="shrink-0"
          @update:model-value="saveTotp"
        />
      </div>

      <!-- Danger zone -->
      <DangerButton
        v-if="canEdit"
        :label-text="t('groups.deleteButton')"
        :hold-offset-sec="2"
        @safe-click="handleDelete"
      />
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import PrimaryButton from '@/components/core/buttons/PrimaryButton.vue';
import DangerButton from '@/components/core/buttons/DangerButton.vue';
import PermissionMatrix from '@/components/users/PermissionMatrix.vue';
import ToggleSwitch from '@/components/core/input/ToggleSwitch.vue';
import { useGroupStore } from '@/store/core/group';
import { useNotificationStore } from '@/store/ui/notifications';
import type { GroupSummary } from '@/data/orgs/GroupDto';
import type { OrgSectionPermissions } from '@/data/orgs/PermissionDto';
import SectionHeading from '@/components/core/SectionHeading.vue';
import InputActionRow from '@/components/core/input/InputActionRow.vue';

/**
 * Expanded group panel: rename, global section permissions, deletion.
 * Membership is managed from the member rows on the Members tab.
 */
const props = defineProps<{
  group: GroupSummary;
  canEdit: boolean;
}>();

const emit = defineEmits<{
  deleted: [];
}>();

const { t } = useI18n();
const groupStore = useGroupStore();
const notifications = useNotificationStore();

const name = ref<string>(props.group.name);
const saving = ref<boolean>(false);
const totpRequired = ref<boolean>(props.group.totpRequired);

function sectionsOf(group: GroupSummary): OrgSectionPermissions {
  return {
    users: group.users,
    settings: group.settings,
    domains: group.domains,
    webhooks: group.webhooks,
    notifications: group.notifications,
    admin: group.admin,
    workspaces: group.workspaces,
  };
}

const draft = ref<OrgSectionPermissions>(sectionsOf(props.group));

const isDirty = computed(() => {
  const current = sectionsOf(props.group);
  return (Object.keys(draft.value) as (keyof OrgSectionPermissions)[])
    .some(key => draft.value[key] !== current[key]);
});

// Keyed on the group id, not the object: live org events replace the array
// (new object identities) and must not wipe unsaved same-entity drafts.
watch(() => props.group.id, () => {
  draft.value = sectionsOf(props.group);
  name.value = props.group.name;
  totpRequired.value = props.group.totpRequired;
});

// The TOTP toggle mirrors saved server state (it is not a draft) — track it.
watch(() => props.group.totpRequired, (value) => {
  totpRequired.value = value;
});

async function saveTotp(value: boolean) {
  const result = await groupStore.setTotpRequired(props.group.id, value);
  if (!result.ok) {
    totpRequired.value = props.group.totpRequired; // revert on failure
    if (result.message) notifications.show(result.message, 'error');
    return;
  }
  notifications.show(t('groups.updated'), 'success');
}

async function rename() {
  const result = await groupStore.renameGroup(props.group.id, name.value.trim());
  if (!result.ok) {
    if (result.message) notifications.show(result.message, 'error');
    return;
  }
  notifications.show(t('groups.updated'), 'success');
}

async function savePermissions() {
  saving.value = true;
  try {
    const result = await groupStore.updateGroupPermissions(props.group.id, { ...draft.value });
    if (!result.ok) {
      if (result.message) notifications.show(result.message, 'error');
      return;
    }
    notifications.show(t('groups.updated'), 'success');
  } finally {
    saving.value = false;
  }
}

async function handleDelete() {
  const result = await groupStore.deleteGroup(props.group.id);
  if (!result.ok) {
    if (result.message) notifications.show(result.message, 'error');
    return;
  }
  notifications.show(t('groups.deleted'), 'success');
  emit('deleted');
}
</script>

<template>
    <div class="px-gutter py-4">
      <div class="flex items-center justify-between mb-2">
        <h2 class="text-lg font-semibold text-text-primary">
          {{ t('variables.orgTitle') }}
        </h2>
        <CreateToggleButton
          v-if="canEdit"
          v-model="showCreateForm"
          :label-text="t('variables.createNew')"
        />
      </div>
      <p class="text-sm text-text-secondary mb-4 max-w-2xl">
        {{ t('variables.orgHint') }}
      </p>

      <VariableCreateForm
        v-if="showCreateForm"
        :resource-prefix="PREFIX"
        @create="handleCreate"
      />

      <LoadingState v-if="orgVariableStore.loading && orgVariableStore.variables.length === 0" />

      <EmptyState
        v-else-if="orgVariableStore.variables.length === 0"
        :icon="faKey"
        :message="t('variables.noVariables')"
      />

      <table
        v-else
        class="w-full table-fixed max-w-4xl"
      >
        <thead>
          <tr class="border-b border-text-secondary/50">
            <th class="text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3 w-1/3">
              {{ t('common.labels.key') }}
            </th>
            <th class="text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3 w-1/3">
              {{ t('common.labels.value') }}
            </th>
            <th class="text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3 w-24">
              {{ t('common.labels.type') }}
            </th>
            <th
              v-if="canEdit"
              class="w-20"
            />
          </tr>
        </thead>
        <tbody>
          <VariableRow
            v-for="variable in sortedVariables"
            :key="variable.id"
            :variable="variable"
            :resource-prefix="PREFIX"
            :can-edit="canEdit"
            :revealed-value="orgVariableStore.revealedValues.get(variable.id)"
            @save="actions.handleSave"
            @delete="actions.handleDelete"
            @toggle="actions.handleToggle"
            @reveal="actions.handleReveal"
            @hide="orgVariableStore.hideValue"
          />
        </tbody>
      </table>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { faKey } from '@fortawesome/free-solid-svg-icons';
import CreateToggleButton from '@/components/core/buttons/CreateToggleButton.vue';
import VariableCreateForm from '@/components/resource/variables/VariableCreateForm.vue';
import VariableRow from '@/components/resource/variables/VariableRow.vue';
import LoadingState from '@/components/core/LoadingState.vue';
import EmptyState from '@/components/core/EmptyState.vue';
import { useOrgVariableStore } from '@/store/core/orgVariable';
import { useAuthStore } from '@/store/core/auth';
import { useVariableActions } from '@/composables/useVariableActions';
import type { CreateVariableRequest, VariableSummary } from '@/data/variables/VariableDto';

/**
 * Org-level variables — the root of the scope chain (`$o.`), gated by the
 * `settings` permission. Flat (no inheritance) unlike the resource editor.
 */
const { t } = useI18n();
const orgVariableStore = useOrgVariableStore();
const authStore = useAuthStore();

const PREFIX = '$o.';
const canEdit = computed(() => authStore.canWrite('settings'));
const showCreateForm = ref<boolean>(false);

const sortedVariables = computed<VariableSummary[]>(() =>
  [...orgVariableStore.variables].sort((a, b) => (a.systemType ? 0 : 1) - (b.systemType ? 0 : 1)));

const actions = useVariableActions({
  create: request => orgVariableStore.createVariable(request),
  update: (variableId, value) => orgVariableStore.updateVariable(variableId, { value }),
  remove: variableId => orgVariableStore.deleteVariable(variableId),
  reveal: variableId => orgVariableStore.revealVariable(variableId),
});

async function handleCreate(request: CreateVariableRequest) {
  if (await actions.handleCreate(request)) showCreateForm.value = false;
}

onMounted(() => {
  void orgVariableStore.fetchVariables();
});
</script>

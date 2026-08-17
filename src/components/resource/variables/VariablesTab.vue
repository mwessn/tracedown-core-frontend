<template>
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-text-primary">
          {{ t('common.labels.variables') }}
        </h2>
      </div>
      <p class="text-sm text-text-secondary mb-4">
        {{ t('variables.hierarchyHint') }}
      </p>

      <LoadingState v-if="variableStore.loading && !variableStore.hierarchy" />

      <template v-else-if="variableStore.hierarchy">
        <VariableScopeSection
          v-for="(scope, index) in visibleScopes"
          :key="scope.scope + ':' + scope.resourceId"
          :scope="scope"
          :can-edit="canEdit"
          :default-open="index === 0"
          :revealed-values="variableStore.revealedValues"
          @create="handleCreate"
          @save="actions.handleSave"
          @delete="actions.handleDelete"
          @toggle="actions.handleToggle"
          @reveal="actions.handleReveal"
          @hide="variableStore.hideValue"
        />
      </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VariableScopeSection from '@/components/resource/variables/VariableScopeSection.vue';
import { useVariableStore } from '@/store/core/variable';
import { useVariableActions } from '@/composables/useVariableActions';
import type {
  CreateVariableRequest,
  VariableResourceType,
  VariableScope,
} from '@/data/variables/VariableDto';
import LoadingState from '@/components/core/LoadingState.vue';

const props = defineProps<{
  resourceType: VariableResourceType;
  resourceId: string;
  canEdit: boolean;
}>();

const { t } = useI18n();
const variableStore = useVariableStore();

/**
 * An inherited scope that contributes nothing is noise, so it is dropped. The
 * editable scope always renders — it owns the create form and the empty state.
 */
const visibleScopes = computed<VariableScope[]>(() =>
  (variableStore.hierarchy?.scopes ?? []).filter(
    s => s.editable || s.variables.length > 0 || s.locked.length > 0,
  ));

// Mutations only ever target the editable (viewed) resource; inherited scopes
// are read-only and never emit these events.
const actions = useVariableActions({
  create: request => variableStore.createVariable(props.resourceType, props.resourceId, request),
  update: (variableId, value) => variableStore.updateVariable(props.resourceType, props.resourceId, variableId, { value }),
  remove: variableId => variableStore.deleteVariable(props.resourceType, props.resourceId, variableId),
  reveal: variableId => variableStore.revealVariable(props.resourceType, props.resourceId, variableId),
});

/** The scope section closes its create form when `done` reports success. */
async function handleCreate(request: CreateVariableRequest, done: (ok: boolean) => void) {
  done(await actions.handleCreate(request));
}

function load() {
  void variableStore.fetchHierarchy(props.resourceType, props.resourceId);
}

watch(() => props.resourceId, load);
onMounted(load);
</script>

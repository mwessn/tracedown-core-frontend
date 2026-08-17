<template>
    <div class="border border-text-secondary/20 rounded-md mb-3">
      <!-- Collapsible header -->
      <button
        type="button"
        class="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-background-secondary/50 transition-colors"
        @click="open = !open"
      >
        <FontAwesomeIcon
          :icon="open ? faChevronDown : faChevronRight"
          class="w-3 h-3 text-text-secondary shrink-0"
        />
        <span class="text-sm font-medium text-text-primary truncate">{{ scope.resourceName }}</span>
        <BadgePill
          color-class="bg-text-secondary/15 text-text-secondary font-mono"
          :label="scope.prefix"
        />
        <span
          v-if="!scope.editable"
          class="text-xs text-text-secondary"
        >{{ t('variables.inherited') }}</span>
        <span class="ml-auto text-xs text-text-secondary">{{ countLabel }}</span>
      </button>

      <!-- Body -->
      <div
        v-show="open"
        class="px-3 pb-3"
      >
        <div
          v-if="scope.editable && canEdit"
          class="flex justify-end mb-2"
        >
          <CreateToggleButton
            v-model="showCreate"
            :label-text="t('variables.createNew')"
          />
        </div>

        <VariableCreateForm
          v-if="showCreate && scope.editable && canEdit"
          :resource-prefix="scope.prefix"
          @create="handleCreate"
        />

        <EmptyState
          v-if="isEmpty"
          compact
          :icon="faKey"
          :message="t('variables.noVariables')"
        />

        <table
          v-else
          class="w-full table-fixed"
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
                v-if="actionsColumn"
                class="w-20"
              />
            </tr>
          </thead>
          <tbody>
            <LockedVariableRow
              v-for="locked in scope.locked"
              :key="`locked-${locked.key}`"
              :locked="locked"
              :resource-prefix="scope.prefix"
              :show-actions="actionsColumn"
            />
            <VariableRow
              v-for="variable in sortedVariables"
              :key="variable.id"
              :variable="variable"
              :resource-prefix="scope.prefix"
              :can-edit="scope.editable && canEdit"
              :readonly="!scope.editable"
              :revealed-value="revealedValues.get(variable.id)"
              @save="(id, value) => emit('save', id, value)"
              @delete="(id) => emit('delete', id)"
              @toggle="(v) => emit('toggle', v)"
              @reveal="(id) => emit('reveal', id)"
              @hide="(id) => emit('hide', id)"
            />
          </tbody>
        </table>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faChevronDown, faChevronRight, faKey } from '@fortawesome/free-solid-svg-icons';
import BadgePill from '@/components/core/BadgePill.vue';
import EmptyState from '@/components/core/EmptyState.vue';
import CreateToggleButton from '@/components/core/buttons/CreateToggleButton.vue';
import VariableCreateForm from '@/components/resource/variables/VariableCreateForm.vue';
import VariableRow from '@/components/resource/variables/VariableRow.vue';
import LockedVariableRow from '@/components/resource/variables/LockedVariableRow.vue';
import type { CreateVariableRequest, VariableScope, VariableSummary } from '@/data/variables/VariableDto';

/**
 * One scope layer of the variables hierarchy, collapsible. The editable scope
 * (the resource being viewed) allows create/edit/delete; inherited ancestor
 * scopes are read-only context. Locked computed variables render at the top of
 * every scope.
 */
const props = defineProps<{
  scope: VariableScope;
  canEdit: boolean;
  defaultOpen: boolean;
  revealedValues: Map<string, string>;
}>();

const emit = defineEmits<{
  create: [request: CreateVariableRequest, done: (ok: boolean) => void];
  save: [variableId: string, value: string];
  delete: [variableId: string];
  toggle: [variable: VariableSummary];
  reveal: [variableId: string];
  hide: [variableId: string];
}>();

const { t } = useI18n();

const open = ref<boolean>(props.defaultOpen);
const showCreate = ref<boolean>(false);

/**
 * On success the form unmounts (and thereby resets) so a second submit can't
 * duplicate the variable; on failure it stays open with its input intact.
 */
function handleCreate(request: CreateVariableRequest) {
  emit('create', request, (ok) => {
    if (ok) showCreate.value = false;
  });
}

/** Actions column present only where rows are editable. */
const actionsColumn = computed<boolean>(() => props.scope.editable && props.canEdit);

/** System vars sorted to top, then user vars. */
const sortedVariables = computed<VariableSummary[]>(() =>
  [...props.scope.variables].sort((a, b) => (a.systemType ? 0 : 1) - (b.systemType ? 0 : 1)));

const isEmpty = computed<boolean>(() =>
  props.scope.variables.length === 0 && props.scope.locked.length === 0);

const countLabel = computed<string>(() =>
  t('variables.scopeCount', { n: props.scope.variables.length + props.scope.locked.length }));
</script>

<template>
    <div
      v-if="authStore.canRead('webhooks')"
      class="space-y-3"
    >
      <LoadingState v-if="loading" />
      <template v-else>
        <PillPicker
          v-if="canManage"
          :title="t('webhooks.bindingsTitle')"
          :available="availableItems"
          :assigned="assignedItems"
          :search-placeholder="t('webhooks.searchPlaceholder')"
          :add-title="t('webhooks.addBinding')"
          :all-assigned-text="t('webhooks.allBound')"
          :none-assigned-text="t('webhooks.noBindings')"
          @add="handleAdd"
        >
          <template #assigned>
            <ul class="divide-y divide-text-secondary/15">
              <li
                v-for="binding in bindings"
                :key="binding.id"
                class="flex items-center gap-3 py-2 first:pt-0 last:pb-0"
                :class="{ 'opacity-50': !binding.enabled }"
              >
                <span class="text-sm text-text-primary truncate">
                  {{ binding.webhookName }}
                </span>
                <div class="flex items-center gap-2 ml-auto shrink-0">
                  <ToggleSwitch
                    :model-value="binding.enabled"
                    :title="binding.enabled ? t('webhooks.bindingEnabled') : t('webhooks.bindingDisabled')"
                    @update:model-value="(value: boolean) => handleToggle(binding, value)"
                  />
                  <IconButton
                    :fa-icon="faTrash"
                    :title="t('common.actions.delete')"
                    color-class="text-text-secondary hover:text-status-failure"
                    icon-class="w-3.5 h-3.5"
                    :hold-offset-sec="3"
                    @safe-click="handleRemove(binding)"
                  />
                </div>
              </li>
            </ul>
          </template>
        </PillPicker>

        <!-- Read-only view without webhooks write -->
        <template v-else>
          <SectionHeading :label="t('webhooks.bindingsTitle')" />
          <EmptyState
            v-if="bindings.length === 0"
            compact
            :message="t('webhooks.noBindings')"
          />
          <ul
            v-else
            class="divide-y divide-text-secondary/15 max-w-xl"
          >
            <li
              v-for="binding in bindings"
              :key="binding.id"
              class="flex items-center gap-3 py-2"
              :class="{ 'opacity-50': !binding.enabled }"
            >
              <span class="text-sm text-text-primary truncate">
                {{ binding.webhookName }}
              </span>
              <BadgePill
                v-if="!binding.enabled"
                class="ml-auto shrink-0"
                color-class="bg-text-secondary/10 text-text-secondary"
                :label="t('webhooks.paused')"
              />
            </li>
          </ul>
        </template>

        <p class="text-xs text-text-secondary">
          {{ t('webhooks.bindingsHint') }}
        </p>
      </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import PillPicker from '@/components/core/PillPicker.vue';
import SectionHeading from '@/components/core/SectionHeading.vue';
import LoadingState from '@/components/core/LoadingState.vue';
import EmptyState from '@/components/core/EmptyState.vue';
import BadgePill from '@/components/core/BadgePill.vue';
import ToggleSwitch from '@/components/core/input/ToggleSwitch.vue';
import IconButton from '@/components/core/buttons/IconButton.vue';
import { useWebhookStore } from '@/store/core/webhook';
import { useAuthStore } from '@/store/core/auth';
import { useNotificationStore } from '@/store/ui/notifications';
import type { PillItem } from '@/types/ui/common';
import type { WebhookBindingSummary } from '@/data/webhooks/WebhookDto';

/**
 * Which org webhooks fire for this resource (§16.5) — same assignment card
 * as the user/group pickers: unbound webhooks as `+` pills in the header,
 * bound ones as body rows with a pause toggle. Hidden without webhooks
 * read; read-only list without webhooks write.
 */
const props = defineProps<{
  resourceType: 'workspace' | 'project' | 'service';
  resourceId: string;
}>();

const { t } = useI18n();
const webhookStore = useWebhookStore();
const authStore = useAuthStore();
const notifications = useNotificationStore();

const canManage = computed(() => authStore.canWrite('webhooks'));

const bindings = ref<WebhookBindingSummary[]>([]);
const loading = ref<boolean>(true);

const availableItems = computed<PillItem[]>(() => {
  const bound = new Set(bindings.value.map(b => b.webhookId));
  return webhookStore.webhooks
    .filter(w => !bound.has(w.id))
    .map(w => ({ id: w.id, label: w.name }));
});

const assignedItems = computed<PillItem[]>(() =>
  bindings.value.map(b => ({ id: b.id, label: b.webhookName })));

async function handleAdd(webhookId: string) {
  const result = await webhookStore.createBinding(props.resourceType, props.resourceId, webhookId);
  if (!result.ok || !result.data) {
    notifications.show(result.message ?? t('common.states.error'), 'error');
    return;
  }
  bindings.value = [...bindings.value, result.data];
}

async function handleToggle(binding: WebhookBindingSummary, enabled: boolean) {
  const result = await webhookStore.setBindingEnabled(binding.id, enabled);
  if (!result.ok) {
    if (result.message) notifications.show(result.message, 'error');
    return;
  }
  bindings.value = bindings.value.map(b => (b.id === binding.id ? { ...b, enabled } : b));
}

async function handleRemove(binding: WebhookBindingSummary) {
  const result = await webhookStore.deleteBinding(binding.id);
  if (!result.ok) {
    if (result.message) notifications.show(result.message, 'error');
    return;
  }
  bindings.value = bindings.value.filter(b => b.id !== binding.id);
}

onMounted(async () => {
  const [bindingsResult] = await Promise.all([
    webhookStore.fetchBindings(props.resourceType, props.resourceId),
    webhookStore.webhooks.length === 0 ? webhookStore.fetchWebhooks() : Promise.resolve(),
  ]);
  bindings.value = bindingsResult.ok ? bindingsResult.data ?? [] : [];
  loading.value = false;
});
</script>

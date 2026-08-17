<template>
    <div class="space-y-2">
      <LoadingState v-if="loading" />
      <template v-else>
        <PillPicker
          :title="t('serviceAgents.title')"
          :available="availableAgents"
          :assigned="assignedAgents"
          :search-placeholder="t('serviceAgents.search')"
          :add-title="t('serviceAgents.add')"
          :remove-title="t('serviceAgents.remove')"
          :all-assigned-text="t('serviceAgents.allAssigned')"
          :none-assigned-text="t('serviceAgents.allAgents')"
          @add="(slug: string) => save([...allowed, slug])"
          @remove="(slug: string) => save(allowed.filter(s => s !== slug))"
        />
        <p class="text-xs text-text-secondary">
          {{ t('serviceAgents.hint') }}
        </p>
      </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import PillPicker from '@/components/core/PillPicker.vue';
import LoadingState from '@/components/core/LoadingState.vue';
import { useServiceStore } from '@/store/core/service';
import { useLiveChannel } from '@/requests';
import { agentHealthChannel, onAgentHealthEvent } from '@/data/agents/agentHealthChannel';
import { useNotificationStore } from '@/store/ui/notifications';
import type { PillItem } from '@/types/ui/common';

/**
 * Restricts which probe agents may run this service. No selection = every
 * active agent (the scheduler default); adding agents pins the service to
 * exactly those. Options come from the public health feed, so any service
 * editor can manage this without agent-admin permissions.
 */
const props = defineProps<{
  serviceId: string;
}>();

const { t } = useI18n();
const serviceStore = useServiceStore();
const notifications = useNotificationStore();

// Same channel the headbar uses — active agents, live.
const { state: healthState } = useLiveChannel(agentHealthChannel, undefined, { onEvent: onAgentHealthEvent });

const allowed = ref<string[]>([]);
const loading = ref<boolean>(true);

const assignedAgents = computed<PillItem[]>(() =>
  allowed.value.map(slug => ({ id: slug, label: slug })));

const availableAgents = computed<PillItem[]>(() => {
  const assigned = new Set(allowed.value);
  return (healthState.value?.statuses ?? [])
    .filter(a => !assigned.has(a.agentSlug))
    .map(a => ({ id: a.agentSlug, label: a.agentSlug }));
});

async function save(slugs: string[]) {
  const result = await serviceStore.setAllowedAgents(props.serviceId, slugs);
  if (!result.ok || !result.data) {
    notifications.show(result.message ?? t('common.states.error'), 'error');
    return;
  }
  allowed.value = result.data;
}

onMounted(async () => {
  const result = await serviceStore.fetchAllowedAgents(props.serviceId);
  allowed.value = result.ok ? result.data ?? [] : [];
  loading.value = false;
});
</script>

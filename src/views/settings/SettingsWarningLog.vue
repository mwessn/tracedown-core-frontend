<template>
    <div class="px-gutter py-4 space-y-3">
      <SectionHeading :label="t('systemAlerts.logTitle')" />
      <p class="text-sm text-text-secondary max-w-2xl">
        {{ t('systemAlerts.logHint') }}
      </p>

      <LoadingState v-if="loading && entries.length === 0" />
      <EmptyState
        v-else-if="entries.length === 0"
        compact
        :message="t('systemAlerts.logEmpty')"
      />
      <template v-else>
        <table class="w-full max-w-4xl text-sm">
          <thead>
            <tr class="text-left text-xs text-text-secondary border-b border-text-secondary/30">
              <th class="py-2 pr-3 font-medium">
                {{ t('systemAlerts.colSeverity') }}
              </th>
              <th class="py-2 pr-3 font-medium">
                {{ t('systemAlerts.colType') }}
              </th>
              <th class="py-2 pr-3 font-medium">
                {{ t('systemAlerts.colSubject') }}
              </th>
              <th class="py-2 pr-3 font-medium">
                {{ t('systemAlerts.colFirstSeen') }}
              </th>
              <th class="py-2 font-medium">
                {{ t('systemAlerts.colLastSeen') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-text-secondary/15">
            <tr
              v-for="entry in entries"
              :key="entry.id"
            >
              <td class="py-2 pr-3">
                <BadgePill
                  :color-class="entry.severity === 'error'
                    ? 'bg-status-failure/10 text-status-failure'
                    : 'bg-status-warning/10 text-status-warning'"
                  :label="t(`systemAlerts.severity.${entry.severity}`, entry.severity)"
                />
              </td>
              <td class="py-2 pr-3 text-text-primary">
                {{ typeLabel(entry.alertType) }}
              </td>
              <td class="py-2 pr-3 font-mono text-xs text-text-secondary">
                {{ entry.subject || '—' }}
              </td>
              <td class="py-2 pr-3 text-text-secondary tabular-nums">
                {{ formatTime(entry.createdAt) }}
              </td>
              <td class="py-2 text-text-secondary tabular-nums">
                {{ formatTime(entry.lastSeenAt) }}
              </td>
            </tr>
          </tbody>
        </table>
        <TablePager
          :page="page"
          :page-size="PAGE_SIZE"
          :total="total"
          @change="loadPage"
        />
      </template>
    </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SectionHeading from '@/components/core/SectionHeading.vue';
import LoadingState from '@/components/core/LoadingState.vue';
import EmptyState from '@/components/core/EmptyState.vue';
import BadgePill from '@/components/core/BadgePill.vue';
import TablePager from '@/components/core/TablePager.vue';
import { useSystemAlertStore } from '@/store/core/systemAlert';
import { useNotificationStore } from '@/store/ui/notifications';
import type { SystemAlertSummary } from '@/data/alerts/SystemAlertDto';

/**
 * Warning log: full history of platform-alert episodes (capacity, agent
 * health). Banners show only the latest per type — this is the durable
 * record.
 */
const { t } = useI18n();
const systemAlertStore = useSystemAlertStore();
const notifications = useNotificationStore();

const PAGE_SIZE = 50;

const entries = ref<SystemAlertSummary[]>([]);
const page = ref<number>(1);
const total = ref<number>(0);
const loading = ref<boolean>(true);

const timeFmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });
function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

function typeLabel(alertType: string): string {
  const key = `systemAlerts.types.${alertType}`;
  const label = t(key);
  return label === key ? alertType : label;
}

async function loadPage(newPage: number) {
  loading.value = true;
  try {
    const result = await systemAlertStore.fetchHistory(newPage, PAGE_SIZE);
    if (!result.ok || !result.data) {
      if (result.message) notifications.show(result.message, 'error');
      return;
    }
    entries.value = result.data.items;
    total.value = result.data.total;
    page.value = newPage;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadPage(1);
});
</script>

<template>
    <div class="space-y-2">
      <p
        v-if="stats.truncated"
        class="text-xs text-text-secondary/70"
      >
        {{ t('statistics.assertionsTruncated', { since: formatDateTime(stats.since) }) }}
      </p>

      <EmptyState
        v-if="rows.length === 0"
        compact
        :icon="faCircleCheck"
        :message="t('statistics.assertionsEmpty')"
      />

      <ul
        v-else
        class="space-y-1"
      >
        <!--  The bar is the ranking, drawn behind the row: the worst assertion
              fills it and everything else is read against that one.  -->
        <li
          v-for="row in rows"
          :key="row.id"
          class="relative overflow-hidden border border-text-secondary/20 px-3 py-2"
        >
          <div
            class="absolute inset-y-0 left-0 bg-status-failure/15"
            :style="{ width: `${row.sharePct}%` }"
            aria-hidden="true"
          />
          <div class="relative flex items-start justify-between gap-3 max-md:flex-col max-md:gap-1">
            <div class="min-w-0">
              <div
                class="text-sm text-text-primary truncate"
                :title="row.endpointKey"
              >
                {{ row.method }} {{ shortTemplate(row.template) }}
              </div>
              <div class="text-xs text-text-secondary break-words">
                {{ assertionText(row) }}
              </div>
            </div>
            <div class="shrink-0 text-right max-md:text-left">
              <div class="text-sm font-medium text-status-failure">
                {{ t('statistics.assertionFailures', { count: formatCount(row.failures) }, row.failures) }}
              </div>
              <div class="text-xs text-text-secondary">
                {{ t('statistics.assertionRate', {
                  rate: row.failureRatePct.toFixed(2),
                  evaluations: formatCount(row.evaluations),
                }) }}
                ·
                {{ t('statistics.assertionLastFailed', { when: formatDateTime(row.lastFailedAt) }) }}
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import EmptyState from '@/components/core/EmptyState.vue';
import { formatCount } from '@/lib/metrics-utils';
import { formatDateTime } from '@/lib/dateFormat';
import { shortTemplate } from '@/utils/endpointStats';
import { buildAssertionRows, type AssertionRow } from '@/utils/assertionStats';
import type { ServiceAssertionStats } from '@/data/metrics/MetricsDto';

/**
 * The assertions that failed most over the window, ranked.
 *
 * The API sends the declared assertion in parts and builds no display string;
 * the sentence is composed here, around a subject written in the script's own
 * vocabulary (`status eq 200`) so it can be found in the script.
 */
const props = defineProps<{
  stats: ServiceAssertionStats;
}>();

const { t } = useI18n();

const rows = computed(() => buildAssertionRows(props.stats.assertions));

function assertionText(row: AssertionRow): string {
  return row.subject
    ? t('statistics.assertionLabel', { method: row.assertionMethod, subject: row.subject })
    : row.assertionMethod;
}
</script>

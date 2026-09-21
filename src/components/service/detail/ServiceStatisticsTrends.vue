<template>
    <!--  Four panels on three sub-resources of the statistics read. Each one is
          hidden unless its own read came back with something: a backend a
          release behind answers 404 for these routes, and a panel that has
          nothing to draw leaves no empty frame behind.  -->
    <div class="space-y-6">
      <section v-if="hasPhaseTrend">
        <SectionHeading class="mb-2" :label="t('statistics.phaseTrend')" />
        <p class="text-xs text-text-secondary/70 mb-2">
          {{ t('statistics.phaseTrendHelp') }}
        </p>
        <PhaseTrendChart :series="series!" />
      </section>

      <section v-if="hasSizeTrend">
        <SectionHeading class="mb-2" :label="t('statistics.sizeTrend')" />
        <p class="text-xs text-text-secondary/70 mb-2">
          {{ t('statistics.sizeTrendHelp') }}
        </p>
        <EndpointSizeChart :series="series!" />
      </section>

      <section v-if="assertionStats">
        <SectionHeading class="mb-2" :label="t('statistics.assertionFailuresTitle')" />
        <p class="text-xs text-text-secondary/70 mb-2">
          {{ t('statistics.assertionFailuresHelp') }}
        </p>
        <AssertionFailuresPanel :stats="assertionStats" />
      </section>

      <section v-if="hasHeatmap">
        <SectionHeading class="mb-2" :label="t('statistics.failureHeatmap')" />
        <p class="text-xs text-text-secondary/70 mb-2">
          {{ t('statistics.failureHeatmapHelp') }}
        </p>
        <FailureHeatmapGrid :heatmap="failureHeatmap!" />
      </section>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { storeToRefs } from 'pinia';
import SectionHeading from '@/components/core/SectionHeading.vue';
import PhaseTrendChart from '@/components/core/graphs/PhaseTrendChart.vue';
import EndpointSizeChart from '@/components/core/graphs/EndpointSizeChart.vue';
import AssertionFailuresPanel from '@/components/core/graphs/AssertionFailuresPanel.vue';
import FailureHeatmapGrid from '@/components/core/graphs/FailureHeatmapGrid.vue';
import { buildSizeTrend, hasPhasePoints } from '@/utils/endpointSeries';
import { useStatisticsStore, type StatWindow } from '@/store/core/statistics';

/**
 * The deep statistics panels: phase trend, response-size trend, most-failing
 * assertions and the failure heatmap.
 *
 * They are their own reads — the series alone is two orders of magnitude more
 * JSON than the statistics response the tab polls — so they load here, beside
 * the panels that use them, rather than with the tab's own data.
 */
const props = defineProps<{
  serviceId: string;
  window: StatWindow;
}>();

const { t } = useI18n();
const store = useStatisticsStore();
const { endpointSeries: series, assertionStats, failureHeatmap } = storeToRefs(store);

const hasPhaseTrend = computed(() =>
  series.value != null && series.value.buckets.length > 0 && hasPhasePoints(series.value.all));

const hasSizeTrend = computed(() =>
  series.value != null && buildSizeTrend(series.value).length > 0);

const hasHeatmap = computed(() => failureHeatmap.value != null && failureHeatmap.value.cells.length > 0);

/**
 * All three in parallel, and every failure ignored on purpose: a backend
 * without these routes answers 404, the transport reports a code rather than a
 * status, and in either case the panel simply does not appear. A server fault
 * is still surfaced globally by the requests layer.
 */
function load(): void {
  void store.fetchEndpointSeries(props.serviceId, props.window);
  void store.fetchAssertions(props.serviceId, props.window);
  void store.fetchFailureHeatmap(props.serviceId);
}

onMounted(load);
watch(() => [props.serviceId, props.window], load);
</script>

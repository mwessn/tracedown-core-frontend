import { computed, ref, watch } from 'vue';
import { useLiveChannel } from '@/requests';
import { serviceChannel } from '@/data/services/serviceChannel';
import { useServiceStore } from '@/store/core/service';
import { useVariableStore } from '@/store/core/variable';
import type { ProbePoint } from '@/data/services/ServiceDto';

const RECENT_PROBES_LIMIT = 10;

/**
 * Live service channel of the opened service: one snapshot round-trip
 * (summary + recent probes) on open; probe.completed events patch the
 * snapshot locally — no refetch — and bump `liveTick` for the results tab.
 * In polling mode the snapshot refreshes on cadence. Must be called from
 * component `setup` (owns a live-channel subscription).
 */
export function useServiceLiveSnapshot(serviceId: () => string) {
  const serviceStore = useServiceStore();
  const variableStore = useVariableStore();

  // Bumped on each live probe.completed; the results tab watches it to prepend.
  const liveTick = ref<number>(0);

  const { state: snapshot } = useLiveChannel(
    serviceChannel,
    serviceId,
    {
      onEvent: (event, current) => {
        if (event.type === 'probe.completed') {
          liveTick.value++;
          if (!current) return;
          // failedCalls/callCount aren't carried by the event — approximate and
          // let the next snapshot fetch correct the drift.
          const point: ProbePoint = {
            status: event.data.status,
            avgResponseMs: event.data.avgResponseMs,
            callCount: 0,
            failedCalls: event.data.status === 'success' ? 0 : 1,
            timestamp: Math.floor(Date.now() / 1000),
          };
          return {
            recentProbes: [...current.recentProbes.slice(-(RECENT_PROBES_LIMIT - 1)), point],
          };
        }
        if (event.type === 'variable.changed') {
          variableStore.refreshIfCurrent('services', event.data.resourceId);
        }
      },
    },
  );

  const recentProbes = computed<ProbePoint[]>(() => snapshot.value?.recentProbes ?? []);

  // Keep the list's copy of the summary in sync with the polled snapshot.
  watch(snapshot, (updated) => {
    if (updated && updated.service.id === serviceId()) {
      serviceStore.updateInPlace(updated.service.id, updated.service);
    }
  });

  return { liveTick, recentProbes };
}

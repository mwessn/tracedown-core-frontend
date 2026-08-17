import { ref } from 'vue';

/**
 * Shared reactive time ticks for "X ago" displays.
 *
 * Components include the relevant tick ref in their computed properties
 * to trigger recalculation. Vue's lazy computed + batched DOM updates
 * ensure no render spikes.
 *
 * - tickSlow: every 45s — general timestamps (service rows, results)
 * - tickFast: every 5s — agent health check display
 */

/** Increments every 45 seconds. */
export const tickSlow = ref<number>(0);

/** Increments every 5 seconds. */
export const tickFast = ref<number>(0);

let slowTimer: ReturnType<typeof setInterval> | null = null;
let fastTimer: ReturnType<typeof setInterval> | null = null;
let refCount = 0;

/** Call from app startup to begin ticking. */
export function startTicks() {
  if (refCount++ > 0) return;
  slowTimer = setInterval(() => { tickSlow.value++; }, 45000);
  fastTimer = setInterval(() => { tickFast.value++; }, 5000);
}

/** Call on app teardown to stop ticking. */
export function stopTicks() {
  if (--refCount > 0) return;
  if (slowTimer) { clearInterval(slowTimer); slowTimer = null; }
  if (fastTimer) { clearInterval(fastTimer); fastTimer = null; }
}

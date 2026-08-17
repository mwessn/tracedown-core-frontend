import { applyProbeToMetrics } from '@/lib/metrics-utils';
import { SERVICE_CATEGORIES, categoryForStatus } from '@/utils/serviceCategories';
import type { ServiceCategory, ServiceCategoryState } from '@/types/services';
import type { FailedAssertion, ServiceSummary } from '@/data/services/ServiceDto';

/**
 * Pure category-bucket mechanics behind the service store: services live in
 * one of three status buckets (failed / new / healthy) and move between them
 * as probe results arrive. No HTTP — every function manipulates the passed-in
 * buckets record in place.
 */

export type ServiceBuckets = Record<ServiceCategory, ServiceCategoryState>;

/** Position of a service within the buckets. */
export interface BucketPosition {
  category: ServiceCategory;
  index: number;
}

/** Locates a service across all buckets. */
export function findService(buckets: ServiceBuckets, serviceId: string): BucketPosition | null {
  for (const category of SERVICE_CATEGORIES) {
    const index = buckets[category].items.findIndex(s => s.id === serviceId);
    if (index !== -1) return { category, index };
  }
  return null;
}

/** Writes the row back, moving it between lists when its bucket changed. */
export function placeService(
  buckets: ServiceBuckets,
  found: BucketPosition,
  updated: ServiceSummary,
) {
  const newCategory = categoryForStatus(updated.lastStatus);
  if (newCategory === found.category) {
    buckets[found.category].items[found.index] = updated;
  } else {
    buckets[found.category].items.splice(found.index, 1);
    buckets[found.category].total--;
    buckets[newCategory].items.unshift(updated);
    buckets[newCategory].total++;
  }
}

/** Replaces a service in its bucket, preserving enriched fields the update may lack. */
export function updateServiceInPlace(
  buckets: ServiceBuckets,
  serviceId: string,
  updated: ServiceSummary,
) {
  const found = findService(buckets, serviceId);
  if (!found) return;
  const existing = buckets[found.category].items[found.index];
  placeService(buckets, found, {
    ...updated,
    metrics: updated.metrics ?? existing.metrics,
    // A successful service HAS no failure — never resurrect the old one.
    // On failure, payloads without enrichment keep the known preview.
    lastFailure: updated.lastStatus === 'success'
      ? null
      : updated.lastFailure ?? existing.lastFailure,
  });
}

/**
 * Applies an incremental metric update from a live probe.completed event.
 * Builds a new service object (reactivity via index assignment) and moves it
 * between buckets when the status bucket changed.
 */
export function applyProbeResult(
  buckets: ServiceBuckets,
  serviceId: string,
  status: string,
  avgResponseMs: number,
  failedAssertions?: FailedAssertion[],
) {
  const found = findService(buckets, serviceId);
  if (!found) return;
  const old = buckets[found.category].items[found.index];

  const statusChanged = old.lastStatus !== status;
  const updated: ServiceSummary = {
    ...old,
    lastStatus: status,
    lastStatusSince: statusChanged ? new Date().toISOString() : old.lastStatusSince,
    lastFailure: status === 'success'
      ? null
      : failedAssertions?.length
        ? { assertions: failedAssertions }
        : old.lastFailure,
    metrics: applyProbeToMetrics(old.metrics, status, avgResponseMs),
  };

  placeService(buckets, found, updated);
}

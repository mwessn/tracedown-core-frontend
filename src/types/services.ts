import type { ServiceSummary, UpdateServiceConfigRequest } from '@/data/services/ServiceDto';

/**
 * Display buckets of the service list. `failed` = last probe failed/timed out,
 * `new` = never ran, `healthy` = last probe succeeded.
 */
export type ServiceCategory = 'failed' | 'new' | 'healthy';

/** One page of services within a category, with the category's total count. */
export interface ServiceCategoryState {
  items: ServiceSummary[];
  total: number;
}

/** What the service edit form hands back: changed config fields + the script (null = unchanged). */
export interface ServiceEditPayload {
  config: UpdateServiceConfigRequest;
  script: string | null;
}

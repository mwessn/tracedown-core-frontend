import type { PfsFilter } from '@/types/pfs';

type PfsSortOrder = 'asc' | 'desc';

interface PfsSorter {
  table: string;
  column: string;
  order: PfsSortOrder;
}

interface PfsParams {
  page: number;
  pageSize: number;
  filters: PfsFilter[];
  sorters: PfsSorter[];
}

export const DEFAULT_PAGE_SIZE = 50;

export function defaultPfsParams(overrides?: Partial<PfsParams>): PfsParams {
  return {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    filters: [],
    sorters: [],
    ...overrides,
  };
}

/**
 * Serializes PFS params to a query string fragment.
 * Returns empty string when all values are defaults (page 1, default pageSize,
 * no filters/sorters). Otherwise returns the fragment with a leading `?`
 * (or `&` if `prefix` is `'&'`).
 */
export function pfsToQueryString(params: PfsParams, prefix: '?' | '&' = '?'): string {
  const parts: string[] = [];
  if (params.page !== 1) parts.push(`page=${params.page}`);
  if (params.pageSize !== DEFAULT_PAGE_SIZE) parts.push(`pageSize=${params.pageSize}`);
  if (params.filters.length > 0) {
    parts.push(`filters=${encodeURIComponent(JSON.stringify(params.filters))}`);
  }
  if (params.sorters.length > 0) {
    parts.push(`sorters=${encodeURIComponent(JSON.stringify(params.sorters))}`);
  }
  if (parts.length === 0) return '';
  return `${prefix}${parts.join('&')}`;
}

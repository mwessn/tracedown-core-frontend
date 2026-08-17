/**
 * PFS (paging / filtering / sorting) — the query contract of list endpoints.
 * Serialization helpers live in `@/utils/pfs`.
 */

export type FilterOperator =
  'eq' | 'neq' | 'greater' | 'less' | 'greaterEq' | 'lessEq' | 'like' | 'notLike' | 'inList'
  | 'isNull' | 'notNull';

export interface PfsFilter {
  table: string;
  column: string;
  operator: FilterOperator;
  value: string;
  ignoreCase?: boolean;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

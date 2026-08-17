import type { SearchResult } from '@/types/ui/common';

/**
 * Pluggable global search behind the header search bar.
 *
 * The default provider resolves to null and the search bar stays a plain
 * input whose committed value the active view consumes as a PFS `like`
 * filter on its own list. Installing a provider (see `setSearchProvider`)
 * turns the bar into a global search: its results render as a navigable
 * dropdown under the input, in addition to the view-local filtering.
 */
interface SearchProvider {
  /**
   * Searches globally for `query`. Returns results for the dropdown, or null
   * when global search is unavailable (view-local filtering still applies).
   */
  search(query: string): Promise<SearchResult[] | null>;
}

/**
 * Active search provider slot.
 *
 * The default provider has no global index and resolves to null — the search
 * bar acts purely as the view-local PFS filter (see `useResourceSearch`).
 * A different implementation can be installed at startup:
 *
 * ```ts
 * setSearchProvider(myGlobalSearchProvider);
 * ```
 */
const defaultSearchProvider: SearchProvider = {
  search: () => Promise.resolve(null),
};

let provider: SearchProvider = defaultSearchProvider;

export function setSearchProvider(next: SearchProvider) {
  provider = next;
}

export function getSearchProvider(): SearchProvider {
  return provider;
}

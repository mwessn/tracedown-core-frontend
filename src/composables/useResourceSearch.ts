import { computed, onBeforeUnmount, onMounted, watch } from 'vue';
import { useSearchStore } from '@/store/ui/search';

/**
 * Wires a view to the shared header search bar: activates it while the view
 * is mounted and invokes `onCommit` with each debounced value. Call at the
 * top level of `setup`.
 */
export function useResourceSearch(onCommit: (value: string) => void) {
  const search = useSearchStore();

  onMounted(() => search.setActive(true));
  onBeforeUnmount(() => search.setActive(false));

  watch(() => search.currentValue, (value) => onCommit(value));

  return {
    searchValue: computed(() => search.currentValue),
  };
}

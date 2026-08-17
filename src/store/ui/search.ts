import { ref } from 'vue';
import { defineStore } from 'pinia';

/**
 * Shared state for the conditionally-mounted search component (SearchBar).
 *
 * Data flow: SearchBar debounces its input and commits the value here; views
 * read it reactively — directly via `currentValue` or through the
 * `useResourceSearch` composable. Provider results stay local to SearchBar;
 * the store only carries the committed query and whether the bar is mounted.
 */
export const useSearchStore = defineStore('search', () => {
  // Whether the shared search bar is currently mounted/visible.
  const active = ref<boolean>(false);

  // Latest committed (debounced) input value. Written by SearchBar, read
  // reactively by views.
  const currentValue = ref<string>('');

  // Called by SearchBar once the debounce window elapses.
  function commit(value: string) {
    currentValue.value = value;
  }

  function setActive(value: boolean) {
    active.value = value;
    if (!value) {
      currentValue.value = '';
    }
  }

  function reset() {
    currentValue.value = '';
  }

  return {
    active,
    currentValue,
    commit,
    setActive,
    reset,
  };
});

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useLoadingStore = defineStore('loading', () => {
  const activeRequests = ref<number>(0);

  const isLoading = computed((): boolean => activeRequests.value > 0);

  function activateLoading() {
    activeRequests.value += 1;
  }

  function stopLoading() {
    activeRequests.value -= 1;
    if (activeRequests.value < 0) {
      activeRequests.value = 0;
    }
  }

  function disableLoading() {
    activeRequests.value = 0;
  }

  return { isLoading, activateLoading, stopLoading, disableLoading };
});

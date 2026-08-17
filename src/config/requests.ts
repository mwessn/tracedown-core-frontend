/**
 * Composition root wiring — supplies the host and exposes the configured layers.
 *
 * This is the one place app concerns enter the requests library. Navigation
 * hooks use `window.location` / a lazy router import to avoid a static cycle
 * (router → views → stores → requests). Importing this module initializes the
 * live runtime as a side effect, so it must load after Pinia is installed; the
 * loading-store lookups are lazy so the store is only touched per request.
 */

import { createRequests } from '@/requests';
import { env } from '@/config/env';
import { resolveError, type ErrorCode } from '@/config/errors';
import { getStoredToken, clearStoredToken } from '@/utils/tokenStorage';
import { useLoadingStore } from '@/store/ui/loading';
import { useNotificationStore } from '@/store/ui/notifications';

export const { http, bulk } = createRequests<ErrorCode>({
  baseUrl: env.apiUrl,
  wsUrl: () => env.wsUrl,
  wsMaxRetries: env.wsMaxRetries,
  authToken: () => getStoredToken() ?? undefined,
  resolveMessage: resolveError,
  onUnauthorized: () => {
    clearStoredToken();
    if (window.location.pathname !== '/login') {
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
    }
  },
  onNotFound: () => {
    void import('@/router').then(({ getRouter }) => {
      void getRouter()?.replace({ name: 'resource-not-found' });
    });
  },
  onLoadingStart: () => useLoadingStore().activateLoading(),
  onLoadingStop: () => useLoadingStore().stopLoading(),
  // Server faults are never a view's fault to explain — surface every 5xx
  // globally. (The notification store dedupes identical consecutive toasts.)
  onServerError: (error) => useNotificationStore().show(error.message, 'error'),
});

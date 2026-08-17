import type { Router } from 'vue-router';

/**
 * Warms every lazy route chunk once the browser is idle, so first navigation
 * to a view doesn't stall on its JS download (painful on slow connections —
 * the view's API calls can't even start until its chunk arrives). Dynamic
 * `import()` is cached, so navigation before the prefetch finishes still
 * resolves to the same in-flight request.
 */
export function prefetchRouteComponents(router: Router) {
  const prefetch = () => {
    for (const record of router.getRoutes()) {
      for (const component of Object.values(record.components ?? {})) {
        if (typeof component === 'function') {
          void (component as () => Promise<unknown>)().catch(() => {
            // Offline / deploy race — the chunk loads normally on navigation.
          });
        }
      }
    }
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(prefetch, { timeout: 5000 });
  } else {
    setTimeout(prefetch, 2000);
  }
}

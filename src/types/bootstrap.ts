import type { App } from 'vue';
import type { RouteRecordRaw } from 'vue-router';

/**
 * Options a host entrypoint can pass to extend the app at startup. All are
 * optional — calling `bootstrapApp()` with none reproduces the standalone app
 * exactly.
 */
export interface BootstrapOptions {
  /** Extra routes spread in after the built-in table. */
  extraRoutes?: RouteRecordRaw[];
  /**
   * Extra routes added as children of an existing route, keyed by parent name —
   * for pages that belong inside a layout rather than beside it.
   *
   * Registered before the router is installed, because installing it resolves
   * the initial URL: a route added later would not exist yet on a direct load
   * of its path, and the visitor would get the not-found page until they
   * navigated client-side.
   */
  extraChildRoutes?: Record<string, RouteRecordRaw[]>;
  /** Locale messages deep-merged into the corresponding i18n locales. */
  extraMessages?: Record<string, Record<string, unknown>>;
  /** Runs after plugins are installed and nav items registered, before mount. */
  onSetup?: (app: App) => void;
  /** Mount to `#app` (default true). Pass false to mount manually. */
  mount?: boolean;
}

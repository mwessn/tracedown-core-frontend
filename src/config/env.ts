/**
 * Resolved configuration, derived from Vite's build-time env (`import.meta.env`).
 *
 * Values come from `.env*` files / Docker build args and are inlined at build.
 * This module centralizes the small amount of normalization the raw strings need
 * (relative WS resolution, retry parsing) so the rest of the app reads typed
 * values, not `import.meta.env`.
 */

const DEFAULT_WS_MAX_RETRIES = 5;

/**
 * A relative WS path (e.g. `/ws`) is resolved against the current origin — the
 * `WebSocket` constructor needs an absolute URL, and same-origin deployments
 * don't know their host at build time. Absolute URLs pass through unchanged.
 */
function resolveWsUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  if (raw.startsWith('/')) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.host}${raw}`;
  }
  return raw;
}

function parseRetries(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export const env = {
  apiUrl: import.meta.env.VITE_API_URL,
  wsUrl: resolveWsUrl(import.meta.env.VITE_WS_URL),
  wsMaxRetries: parseRetries(import.meta.env.VITE_WS_MAX_RETRIES, DEFAULT_WS_MAX_RETRIES),
};

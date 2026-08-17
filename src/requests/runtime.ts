/**
 * Module-level holder for the live runtime.
 *
 * There is exactly one configured requests instance per app, so the Vue binding
 * reaches the registry through this singleton rather than threading it down the
 * component tree. Set once by `createRequests`.
 */

import type { LiveRegistry } from '@/requests/live/registry';
import type { LiveConnection } from '@/requests/live/connection';

// The Code generic is erased at this boundary; the typed surface is the channel
// definitions and handles, not the registry instance itself.
let registry: LiveRegistry<string> | null = null;
let connection: LiveConnection | null = null;

export function setLiveRegistry(instance: LiveRegistry<string>) {
  registry = instance;
}

export function getLiveRegistry(): LiveRegistry<string> {
  if (!registry) {
    throw new Error('Requests not initialized — call createRequests() before using live channels.');
  }
  return registry;
}

/** The raw socket, for bidirectional features (collaborative editing) that the
 *  server→client channel registry doesn't model. */
export function setLiveConnection(instance: LiveConnection) {
  connection = instance;
}

export function getLiveConnection(): LiveConnection {
  if (!connection) {
    throw new Error('Requests not initialized — call createRequests() before using the live connection.');
  }
  return connection;
}

/**
 * Live channel for probe-agent health — a global singleton (no params).
 *
 * Demonstrates both transports feeding one state slot:
 *   - firstFetch / poll: `GET /agents/health` → the full `AgentHealthResponse`.
 *   - WS (`agents` / `health.updated`): one agent's status, upserted by the
 *     view's handler into the `statuses` array.
 *
 * Core = First = Poll here (no detail/compact split), so the shape collapses to
 * a single type; `statuses` is the live-updatable subset.
 */

import { defineChannel } from '@/requests';
import { useAgentStore } from '@/store/core/agent';
import type { LiveHandler } from '@/requests';
import type { AgentHealthResponse, AgentStatus } from '@/data/agents/AgentDto';

// A `type` alias (not `interface`): an event map must satisfy `EventMap`
// (Record<string, unknown>), which only closed type literals do.
type AgentHealthEvents = {
  'health.updated': AgentStatus;
  'agent.removed': { agentSlug: string };
};

export const agentHealthChannel = defineChannel<
  AgentHealthResponse,
  AgentHealthResponse,
  AgentHealthResponse,
  AgentHealthEvents
>()({
  key: () => 'agents',
  firstFetchUrl: () => '/agents/health',
  pollUrl: () => '/agents/health',
  pollFreqMs: 3000,
});

/**
 * Canonical delta interpreter for the channel: upserts the event's agent into
 * `statuses`. Shared by every consumer (the registry keeps one handler per
 * channel identity, so all consumers must agree anyway).
 */
export const onAgentHealthEvent: LiveHandler<AgentHealthResponse, AgentHealthResponse, AgentHealthEvents> =
  (event, current) => {
    if (event.type === 'health.updated') {
      const incoming = event.data;
      const statuses = current?.statuses ?? [];
      const exists = statuses.some((a) => a.agentSlug === incoming.agentSlug);
      return {
        statuses: exists
          ? statuses.map((a) => (a.agentSlug === incoming.agentSlug ? incoming : a))
          : [...statuses, incoming],
      };
    }
    if (event.type === 'agent.removed') {
      const removed = event.data.agentSlug;
      // The admin fleet list keys off the same event — updating it here keeps
      // the side effect in the channel's single canonical handler (the
      // registry ignores handlers from later consumers).
      const agentStore = useAgentStore();
      agentStore.agents = agentStore.agents.filter((a) => a.slug !== removed);
      return { statuses: (current?.statuses ?? []).filter((a) => a.agentSlug !== removed) };
    }
  };

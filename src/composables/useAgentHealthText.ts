import { useI18n } from 'vue-i18n';
import type { AgentStatus } from '@/data/agents/AgentDto';

/**
 * The two things an agent's round trip needs said about it: what it was, and
 * what the backend makes of it.
 *
 * The figure is shown on its own. How it compares with the agent's usual pace
 * is the backend's judgement to make, not the reader's: the verdict arrives as
 * `degraded`, and only then is the ceiling it was reached from explained.
 * Shared by the status feed and the fleet list so the two cannot drift apart.
 */
export function useAgentHealthText() {
  const { t } = useI18n();

  const ms = (value: number): string => t('agents.roundTripText.ms', { ms: value.toLocaleString() });

  /** "1,650 ms"; empty until a round has been measured. */
  function roundTripLabel(agent: AgentStatus): string {
    return agent.lastResponseMs == null ? '' : ms(agent.lastResponseMs);
  }

  /** What the agent is called degraded against; empty when it is not degraded. */
  function degradedReason(agent: AgentStatus): string | undefined {
    if (!agent.degraded || agent.degradedThresholdMs == null) return undefined;
    return t('agents.roundTripText.degradedReason', { threshold: ms(agent.degradedThresholdMs) });
  }

  return { roundTripLabel, degradedReason };
}

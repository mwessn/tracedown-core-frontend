import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { HelpEntry } from '@/types/ui/help';

/**
 * Help-tooltip entries for the service probe mode and queue policy fields,
 * shared by the config view and the edit form. Must be called from component
 * `setup` (uses i18n).
 */
export function useServiceHelp() {
  const { t } = useI18n();

  const probeModeHelp = computed<HelpEntry[]>(() => [
    { term: t('service.probeModeConsecutive'), description: t('service.probeModeConsecutiveHelp') },
    { term: t('service.probeModeSimultaneous'), description: t('service.probeModeSimultaneousHelp') },
    { term: t('service.probeModeRandom'), description: t('service.probeModeRandomHelp') },
  ]);

  const queuePolicyHelp = computed<HelpEntry[]>(() => [
    { term: t('service.queuePolicySkip'), description: t('service.queuePolicySkipHelp') },
    { term: t('service.queuePolicyEnqueue'), description: t('service.queuePolicyEnqueueHelp') },
  ]);

  return { probeModeHelp, queuePolicyHelp };
}

<template>
    <div class="rounded-lg bg-background-primary p-3 space-y-3">
      <p class="text-xs text-text-secondary">
        {{ isDns ? t('domains.dnsInstructionsShort') : t('domains.httpInstructionsShort') }}
      </p>

      <CopyField
        :label="isDns ? t('domains.recordName') : t('domains.challengeUrl')"
        :value="location"
        value-class="text-xs font-mono text-text-primary bg-background-secondary rounded px-2 py-1.5"
      />

      <CopyField
        :label="isDns ? t('domains.recordValue') : t('domains.challengeBody')"
        :value="value"
        value-class="text-xs font-mono text-text-primary bg-background-secondary rounded px-2 py-1.5"
      />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import CopyField from '@/components/common/CopyField.vue';
import type { DomainSummary } from '@/data/domains/DomainDto';

/**
 * Challenge placement instructions for one domain — record name/URL and
 * value, both copyable. Shared by the post-create modal and the row
 * expansion.
 */
const props = defineProps<{
  domain: DomainSummary;
}>();

const { t } = useI18n();

const isDns = computed(() => props.domain.verificationType === 'dns-01');

const location = computed(() => isDns.value
  ? `_tracedown-verify.${props.domain.domain}`
  : `https://${props.domain.domain}/.well-known/tracedown-verify.txt`);

const value = computed(() => isDns.value
  ? `tracedown-verify=${props.domain.challenge}`
  : props.domain.challenge);
</script>

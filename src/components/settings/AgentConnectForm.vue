<template>
    <div class="space-y-3 max-w-xl">
      <template v-if="open">
        <p class="text-sm text-text-secondary">
          {{ t('agents.connectHint') }}
        </p>

        <div class="flex items-end gap-2 flex-wrap">
          <div>
            <p class="text-xs text-text-secondary mb-1">
              {{ t('agents.slug') }}
            </p>
            <TextInput
              v-model="newSlug"
              class="w-48"
              :placeholder="t('agents.slugPlaceholder')"
            />
          </div>
          <div>
            <p class="text-xs text-text-secondary mb-1">
              {{ t('agents.label') }}
            </p>
            <TextInput
              v-model="newLabel"
              class="w-48"
              :placeholder="t('agents.slug')"
            />
          </div>
          <PrimaryButton
            :label-text="t('agents.generateToken')"
            :loading="generating"
            :disabled="!slugValid"
            :on-click="handleGenerate"
          />
        </div>
        <p
          v-if="newSlug && !slugValid"
          class="text-xs text-status-warning"
        >
          {{ t('agents.slugInvalid') }}
        </p>
      </template>

      <!-- Show-once token -->
      <div
        v-if="issued"
        class="rounded-lg border border-status-warning/40 bg-status-warning/5 p-4 space-y-2"
      >
        <p class="text-sm text-text-primary">
          {{ t('agents.tokenIssued', { slug: issued.slug }) }}
        </p>
        <CopyField :value="issued.token" />
        <p class="text-xs text-text-secondary">
          {{ t('agents.tokenInstructions') }}
        </p>

        <p class="text-sm text-text-primary pt-1">
          {{ t('agents.startCommand') }}
        </p>
        <CopyField
          :value="startCommand"
          multiline
        />
        <p class="text-xs text-text-secondary">
          {{ t('agents.startCommandHint') }}
        </p>
      </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import CopyField from '@/components/common/CopyField.vue';
import PrimaryButton from '@/components/core/buttons/PrimaryButton.vue';
import TextInput from '@/components/core/input/TextInput.vue';
import { useAgentStore } from '@/store/core/agent';
import { useNotificationStore } from '@/store/ui/notifications';
import type { BootstrapTokenResponse } from '@/data/agents/AgentDto';

/**
 * "Connect a new agent" flow: slug/label → one-time bootstrap token →
 * show-once panel with the token and the full local startup command.
 * The open state is owned by the parent (toggle sits in the list header).
 */
const open = defineModel<boolean>('open', { required: true });
const { t } = useI18n();
const agentStore = useAgentStore();
const notifications = useNotificationStore();

const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;

const newSlug = ref<string>('');
const newLabel = ref<string>('');
const generating = ref<boolean>(false);
const issued = ref<BootstrapTokenResponse | null>(null);

const slugValid = computed(() => SLUG_RE.test(newSlug.value.trim()));

/**
 * Full local startup command (locally built image; swaps to the published
 * Docker Hub image once released).
 */
const startCommand = computed(() => {
  if (!issued.value) return '';
  return [
    `docker run -d \\`,
    `  --name tracedown-agent-${issued.value.slug} \\`,
    `  --network tracedown_tracedown-net \\`,
    `  -v tracedown_tracedown-bodies:/data/bodies \\`,
    `  -e PROBE_AGENT_BOOTSTRAP_TOKEN="${issued.value.token}" \\`,
    `  -e PROBE_AGENT_SCHEDULER_URL=http://tracedown-gateway:20714 \\`,
    `  -e PROBE_AGENT_PORT=8443 \\`,
    `  -e PROBE_AGENT_STORAGE_BACKEND=filesystem \\`,
    `  -e PROBE_AGENT_STORAGE_DIR=/data/bodies \\`,
    `  tracedown-agent`,
  ].join('\n');
});

async function handleGenerate() {
  if (generating.value) return;
  generating.value = true;
  try {
    const result = await agentStore.createBootstrapToken({
      slug: newSlug.value.trim(),
      label: newLabel.value.trim() || undefined,
    });
    if (!result.ok || !result.data) {
      notifications.show(result.message ?? t('common.states.error'), 'error');
      return;
    }
    issued.value = result.data;
    newSlug.value = '';
    newLabel.value = '';
  } finally {
    generating.value = false;
  }
}
</script>

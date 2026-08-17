<template>
    <div class="space-y-3 max-w-sm">
      <SectionHeading :label="t('account.totpSection')" />

      <!-- Enabled: status + disable-with-code -->
      <template v-if="authStore.user?.totpEnabled && !enrolling">
        <div class="flex items-center gap-2">
          <BadgePill
            color-class="bg-status-success/10 text-status-success"
            :label="t('account.totpEnabled')"
          />
        </div>
        <form
          class="space-y-3"
          @submit.prevent="handleDisable"
        >
          <LabeledInput
            id="totpDisableCode"
            v-model="disableCode"
            :label="t('account.totpDisableHint')"
            name="totpDisableCode"
            type="text"
            autocomplete="one-time-code"
            :placeholder="t('auth.totpLabel')"
            required
          />
          <DangerButton
            :label-text="t('account.totpDisable')"
            :loading="submitting"
            :disabled="disableCode.trim().length < 6"
            :hold-offset-sec="3"
            @safe-click="handleDisable"
          />
        </form>

        <!-- Recovery codes: regenerate a fresh set (invalidates the old). -->
        <div class="border-t border-text-secondary/20 pt-3 space-y-2">
          <p class="text-xs text-text-secondary">
            {{ t('account.recoveryRegenHint') }}
          </p>
          <template v-if="newRecoveryCodes">
            <ul class="grid grid-cols-2 gap-1 font-mono text-sm text-text-primary">
              <li v-for="c in newRecoveryCodes" :key="c">
                {{ c }}
              </li>
            </ul>
            <GhostButton :label-text="t('common.actions.done')" :on-click="() => (newRecoveryCodes = null)" />
          </template>
          <form
            v-else
            class="space-y-2"
            @submit.prevent="handleRegen"
          >
            <LabeledInput
              id="totpRegenCode"
              v-model="regenCode"
              :label="t('account.recoveryRegen')"
              name="totpRegenCode"
              type="text"
              autocomplete="one-time-code"
              :placeholder="t('auth.totpLabel')"
              required
            />
            <SecondaryButton
              type="submit"
              :label-text="t('account.recoveryRegen')"
              :loading="regenerating"
              :disabled="regenCode.trim().length < 6"
            />
          </form>
        </div>
      </template>

      <!-- Disabled (or mid-enrollment): the shared setup form -->
      <Totp2faSetupForm
        v-else
        :secret="setup?.secret"
        :otpauth-uri="setup?.otpauthUri"
        :recovery-codes="recoveryCodes ?? undefined"
        :loading="submitting"
        :error="error ?? undefined"
        @start="handleStart"
        @confirm="handleConfirm"
        @done="handleDone"
      />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import BadgePill from '@/components/core/BadgePill.vue';
import DangerButton from '@/components/core/buttons/DangerButton.vue';
import SecondaryButton from '@/components/core/buttons/SecondaryButton.vue';
import GhostButton from '@/components/core/buttons/GhostButton.vue';
import LabeledInput from '@/components/core/input/LabeledInput.vue';
import SectionHeading from '@/components/core/SectionHeading.vue';
import Totp2faSetupForm from '@/components/core/auth/Totp2faSetupForm.vue';
import { useAuthStore } from '@/store/core/auth';
import { useNotificationStore } from '@/store/ui/notifications';
import type { TotpSetupResponse } from '@/data/auth/AuthDto';

/**
 * Two-factor management: enroll via the same controlled setup form the
 * login flow uses; disable requires a valid TOTP or recovery code.
 */
const { t } = useI18n();
const authStore = useAuthStore();
const notifications = useNotificationStore();

const setup = ref<TotpSetupResponse | null>(null);
const recoveryCodes = ref<string[] | null>(null);
const enrolling = ref<boolean>(false);
const disableCode = ref<string>('');
const submitting = ref<boolean>(false);
const error = ref<string | null>(null);
const regenCode = ref<string>('');
const regenerating = ref<boolean>(false);
const newRecoveryCodes = ref<string[] | null>(null);

async function handleStart() {
  submitting.value = true;
  error.value = null;
  try {
    const result = await authStore.beginTotpEnroll();
    if (!result.ok || !result.data) {
      error.value = result.message ?? t('common.states.error');
      return;
    }
    setup.value = result.data;
    enrolling.value = true;
  } finally {
    submitting.value = false;
  }
}

async function handleConfirm(code: string) {
  if (!setup.value) return;
  submitting.value = true;
  error.value = null;
  try {
    const result = await authStore.confirmTotpEnroll(setup.value.confirmToken, code);
    if (!result.ok) {
      error.value = result.message ?? t('common.states.error');
      return;
    }
    recoveryCodes.value = result.recoveryCodes ?? [];
  } finally {
    submitting.value = false;
  }
}

async function handleDone() {
  setup.value = null;
  recoveryCodes.value = null;
  enrolling.value = false;
  await authStore.fetchMe();
}

async function handleRegen() {
  if (regenerating.value) return;
  regenerating.value = true;
  try {
    const result = await authStore.regenerateRecoveryCodes(regenCode.value.trim());
    if (!result.ok || !result.codes) {
      notifications.show(result.message ?? t('common.states.error'), 'error');
      return;
    }
    regenCode.value = '';
    newRecoveryCodes.value = result.codes;
  } finally {
    regenerating.value = false;
  }
}

async function handleDisable() {
  if (submitting.value) return;
  submitting.value = true;
  try {
    const result = await authStore.disableTotp(disableCode.value.trim());
    if (!result.ok) {
      notifications.show(result.message ?? t('common.states.error'), 'error');
      return;
    }
    disableCode.value = '';
    notifications.show(t('account.totpDisabled'), 'success');
    await authStore.fetchMe();
  } finally {
    submitting.value = false;
  }
}
</script>

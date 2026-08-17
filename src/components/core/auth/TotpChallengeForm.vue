<template>
    <form
      class="space-y-4"
      @submit.prevent="handleConfirm"
    >
      <div>
        <span class="block text-sm font-medium text-text-primary mb-1">
          {{ recoveryMode ? t('auth.recoveryCodeLabel') : t('auth.totpLabel') }}
        </span>
        <OtpCodeInput
          v-if="!recoveryMode"
          v-model="code"
          autofocus
          :disabled="submitting"
          @complete="handleConfirm"
        />
        <TextInput
          v-else
          v-model="code"
          class="font-mono"
          autocomplete="off"
          name="recovery-code"
          :placeholder="t('auth.recoveryCodeLabel')"
          :disabled="submitting"
        />
      </div>
      <LinkButton
        :label-text="recoveryMode ? t('auth.useAuthenticatorCode') : t('auth.useRecoveryCode')"
        color-class="text-text-secondary hover:text-text-primary"
        @click="toggleRecoveryMode"
      />

      <p
        v-if="error"
        class="text-status-failure text-sm"
      >
        {{ error }}
      </p>

      <div class="flex gap-3">
        <SecondaryButton
          full-width
          :label-text="t('common.actions.cancel')"
          :on-click="() => emit('cancel')"
        />
        <PrimaryButton
          type="submit"
          full-width
          :label-text="t('common.actions.confirm')"
          :loading="submitting"
          :disabled="!codeValid"
        />
      </div>
    </form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/store/core/auth';
import TextInput from '@/components/core/input/TextInput.vue';
import OtpCodeInput from '@/components/core/input/OtpCodeInput.vue';
import PrimaryButton from '@/components/core/buttons/PrimaryButton.vue';
import SecondaryButton from '@/components/core/buttons/SecondaryButton.vue';
import LinkButton from '@/components/core/buttons/LinkButton.vue';

/**
 * Second sign-in factor: verifies a 6-digit authenticator code (or a recovery
 * code) against the login challenge issued by the credentials step.
 */
const props = defineProps<{
  /** Opaque challenge token from the totp_required login outcome. */
  challenge: string;
}>();

const emit = defineEmits<{
  /** The code verified and the session is established. */
  success: [];
  /** The user abandoned the challenge; parent restores the plain login form. */
  cancel: [];
}>();

const { t } = useI18n();
const auth = useAuthStore();

const code = ref<string>('');
const recoveryMode = ref<boolean>(false);
const error = ref<string>('');
const submitting = ref<boolean>(false);

const codeValid = computed(() =>
  recoveryMode.value ? code.value.trim().length >= 8 : code.value.length === 6);

async function handleConfirm() {
  if (!codeValid.value || submitting.value) return;
  error.value = '';
  submitting.value = true;
  try {
    const result = await auth.verifyTotpLogin(props.challenge, code.value.trim());
    if (!result.ok) {
      error.value = result.message ?? t('errors.unknown_error');
      code.value = '';
      return;
    }
    emit('success');
  } finally {
    submitting.value = false;
  }
}

function toggleRecoveryMode() {
  recoveryMode.value = !recoveryMode.value;
  code.value = '';
  error.value = '';
}
</script>

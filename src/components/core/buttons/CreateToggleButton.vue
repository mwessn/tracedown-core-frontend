<template>
    <span
      v-if="!model"
      class="inline-block"
      :title="disabled ? hint : undefined"
    >
      <PrimaryButton
        :label-text="labelText"
        :fa-icon="faPlus"
        :disabled="disabled"
        :on-click="() => model = true"
      />
    </span>
    <SecondaryButton
      v-else
      :label-text="t('common.actions.cancel')"
      :fa-icon="faXmark"
      :on-click="() => model = false"
    />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { faPlus, faXmark } from '@fortawesome/free-solid-svg-icons';
import PrimaryButton from '@/components/core/buttons/PrimaryButton.vue';
import SecondaryButton from '@/components/core/buttons/SecondaryButton.vue';

/**
 * "New X" button that turns into "Cancel" while the creation form is open —
 * it keeps its place in the header row, so nothing jumps when toggling.
 */
defineProps<{
  /** Label of the closed state, e.g. "New project". */
  labelText: string;
  /** Grays out the "New" action (e.g. a host vetoed it via a feature gate). */
  disabled?: boolean;
  /** Native tooltip shown when disabled, explaining why. */
  hint?: string;
}>();

/** Open state of the creation form. */
const model = defineModel<boolean>({ required: true });

const { t } = useI18n();
</script>

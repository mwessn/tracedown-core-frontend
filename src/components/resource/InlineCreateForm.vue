<template>
    <div class="mb-6 p-3 border-b border-text-secondary/50">
      <h3 class="text-sm font-medium text-text-primary mb-3">
        {{ title }}
      </h3>
      <InputActionRow
        v-model="name"
        compact
        :placeholder="placeholder"
        :action-label="actionLabel ?? t('common.actions.create')"
        @submit="emit('create', $event)"
      />
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import InputActionRow from '@/components/core/input/InputActionRow.vue';

/**
 * Name-only inline creation form shared by project/service creation.
 * Dismissal is owned by the header's CreateToggleButton — no cancel here.
 */
withDefaults(
  defineProps<{
    title: string;
    placeholder: string;
    /** Overrides the default "Create" action label. */
    actionLabel?: string;
  }>(),
  {
    actionLabel: undefined,
  }
);

const emit = defineEmits<{
  create: [name: string];
}>();

const { t } = useI18n();

const name = ref<string>('');
</script>

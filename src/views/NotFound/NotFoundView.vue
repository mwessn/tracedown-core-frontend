<template>
    <div class="min-h-screen flex flex-col items-center justify-center px-6">
      <FontAwesomeIcon :icon="faCircleExclamation" class="w-12 h-12 text-text-secondary mb-4" />
      <h1 class="text-xl font-semibold text-text-primary mb-2">
        {{ t('resource.pageNotFound') }}
      </h1>
      <p class="text-sm text-text-secondary mb-6">
        {{ t('resource.pageNotFoundDescription') }}
      </p>
      <router-link :to="{ name: 'home' }">
        <PrimaryButton :label-text="t('common.actions.backToHome')" />
      </router-link>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import PrimaryButton from '@/components/core/buttons/PrimaryButton.vue';

const { t } = useI18n();
</script>

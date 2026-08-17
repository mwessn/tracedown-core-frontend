<template>
    <div class="px-gutter py-6">
      <VariablesTab
        resource-type="workspaces"
        :resource-id="workspaceId"
        :can-edit="authStore.canWriteScoped([`workspace::${workspaceId}`])"
      />
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import VariablesTab from '@/components/resource/variables/VariablesTab.vue';
import { useAuthStore } from '@/store/core/auth';

const route = useRoute();
const authStore = useAuthStore();

const workspaceId = computed(() => route.params.workspaceId as string);
</script>

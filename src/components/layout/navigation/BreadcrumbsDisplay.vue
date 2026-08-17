<template>
    <div>
      <nav
        v-if="navigationStore.breadcrumbs.length"
        class="flex items-center gap-1.5 text-xs text-text-secondary mb-1"
      >
        <template
          v-for="(crumb, i) in navigationStore.breadcrumbs"
          :key="i"
        >
          <router-link
            v-if="crumb.to"
            :to="crumb.to"
            class="hover:text-text-primary transition-colors"
          >
            {{ crumb.label }}
          </router-link>
          <span v-else>{{ crumb.label }}</span>
          <FontAwesomeIcon :icon="faChevronRight" class="w-2 h-2" />
        </template>
        <span class="text-text-secondary">{{ title }}</span>
      </nav>
      <div class="flex items-center gap-2">
        <h1 class="text-xl font-semibold text-text-primary cursor-default">
          {{ title }}
        </h1>
        <!-- Inline title actions (e.g. the silence bell) -->
        <slot />
      </div>
    </div>
</template>

<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { useNavigationStore } from '@/store/ui/navigation';

/** Crumb trail (from the navigation store) topped with the current page title. */
defineProps<{
  title: string;
}>();

const navigationStore = useNavigationStore();
</script>

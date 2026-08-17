<template>
    <span
      v-if="visible"
      @click.stop
    >
      <IconButton
        :fa-icon="silenced || inherited ? faBellSlash : faBell"
        :title="inherited
          ? t('silences.inherited')
          : silenced ? t('silences.muted') : t('silences.mute')"
        :color-class="silenced || inherited
          ? 'text-status-warning hover:text-text-primary'
          : 'text-text-secondary hover:text-accent-primary'"
        icon-class="w-3.5 h-3.5"
        :disabled="inherited"
        @click="handleToggle"
      />
    </span>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { faBell, faBellSlash } from '@fortawesome/free-solid-svg-icons';
import IconButton from '@/components/core/buttons/IconButton.vue';
import { useAuthStore } from '@/store/core/auth';
import { useSilenceStore } from '@/store/core/silence';
import { useNotificationStore } from '@/store/ui/notifications';
import type { GrantResourceType } from '@/data/orgs/PermissionDto';

/**
 * Per-resource notification mute for the current user. Rendered only when
 * the user holds an explicit grant (notification eligibility). When an
 * ancestor scope is silenced the bell shows as silenced and locked —
 * unless the user holds an explicit grant on THIS resource, in which case
 * the broader silence doesn't cover them (most specific grant wins, same
 * rule the dispatcher applies) and the bell stays independent. The wrapper
 * stops click propagation so the bell can sit inside clickable cards/rows.
 */
const props = withDefaults(
  defineProps<{
    resourceType: GrantResourceType;
    resourceId: string;
    /** Ancestor keys ("type::id") — a parent grant covers this resource. */
    parentKeys?: string[];
  }>(),
  {
    parentKeys: () => [],
  }
);

const { t } = useI18n();
const authStore = useAuthStore();
const silenceStore = useSilenceStore();
const notifications = useNotificationStore();

/** Only grant holders receive notifications — no grant, nothing to silence. */
const visible = computed(() => authStore.hasResourceGrant([
  `${props.resourceType}::${props.resourceId}`,
  ...props.parentKeys,
]));

const silenced = computed(() => silenceStore.isSilenced(props.resourceType, props.resourceId));

/**
 * Silenced through an ancestor scope, with no explicit grant here — the
 * parent silence covers this resource, so the bell is display-only.
 */
const inherited = computed(() => {
  if (authStore.hasResourceGrant([`${props.resourceType}::${props.resourceId}`])) return false;
  return props.parentKeys.some((key) => {
    const [type, id] = key.split('::');
    return silenceStore.isSilenced(type as GrantResourceType, id);
  });
});

async function handleToggle() {
  if (inherited.value) return;
  const result = await silenceStore.toggle(props.resourceType, props.resourceId);
  if (!result.ok && result.message) notifications.show(result.message, 'error');
}

onMounted(() => {
  void silenceStore.ensureLoaded();
});
</script>

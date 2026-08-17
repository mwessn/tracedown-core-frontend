<template>
    <div class="px-gutter py-4 space-y-4">
      <SectionHeading :label="t('nav.audit')" />

      <!-- Filters -->
      <div class="flex items-end gap-2 flex-wrap">
        <div>
          <p class="text-xs text-text-secondary mb-1">
            {{ t('audit.filterAction') }}
          </p>
          <TextInput
            v-model="actionFilter"
            class="w-44"
            compact
            :placeholder="t('audit.actionPlaceholder')"
          />
        </div>
        <div>
          <p class="text-xs text-text-secondary mb-1">
            {{ t('audit.filterEntity') }}
          </p>
          <AppSelect
            v-model="entityFilter"
            class="w-44"
            searchable
            :options="entityOptions"
          />
        </div>
        <div v-if="actorOptions.length > 1">
          <p class="text-xs text-text-secondary mb-1">
            {{ t('audit.filterActor') }}
          </p>
          <AppSelect
            v-model="actorFilter"
            class="w-52"
            searchable
            :options="actorOptions"
          />
        </div>
      </div>

      <LoadingState v-if="auditStore.loading && auditStore.entries.length === 0" />
      <EmptyState
        v-else-if="auditStore.entries.length === 0"
        compact
        :message="t('audit.none')"
      />
      <table
        v-else
        class="w-full table-fixed"
      >
        <thead>
          <tr class="border-b border-text-secondary/50">
            <th class="text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3 w-40">
              {{ t('audit.time') }}
            </th>
            <th class="text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3 w-52">
              {{ t('audit.actor') }}
            </th>
            <th class="text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3 w-56">
              {{ t('audit.action') }}
            </th>
            <th class="text-left text-xs font-medium text-text-secondary uppercase tracking-wider py-2 px-3">
              {{ t('audit.entity') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <template
            v-for="entry in auditStore.entries"
            :key="entry.id"
          >
            <tr
              class="border-b border-text-secondary/15 cursor-pointer hover:bg-background-primary/50"
              @click="expandedId = expandedId === entry.id ? null : entry.id"
            >
              <td class="py-2 px-3 text-xs text-text-secondary tabular-nums">
                {{ formatTime(entry.createdAt) }}
              </td>
              <td class="py-2 px-3 text-sm text-text-primary truncate">
                {{ actorLabel(entry) }}
              </td>
              <td class="py-2 px-3">
                <code class="text-xs font-mono text-text-primary">{{ entry.action }}</code>
              </td>
              <td class="py-2 px-3 text-xs text-text-secondary truncate">
                <template v-if="entry.entityType">
                  {{ entry.entityType }}
                  <!-- The name the entity had at the time reads far better than its
                       raw id; fall back to the id only when no name was recorded. -->
                  <span
                    v-if="entry.entityDisplayName"
                    class="text-text-primary"
                  >{{ entry.entityDisplayName }}</span>
                  <span
                    v-else-if="entry.entityId"
                    class="font-mono"
                  >{{ entry.entityId }}</span>
                </template>
              </td>
            </tr>
            <tr v-if="expandedId === entry.id">
              <AuditEntryDetail :entry="entry" />
            </tr>
          </template>
        </tbody>
      </table>

      <TablePager
        :page="auditStore.page"
        :page-size="50"
        :total="auditStore.total"
        @change="(p: number) => auditStore.fetchEntries(p)"
      />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import SectionHeading from '@/components/core/SectionHeading.vue';
import LoadingState from '@/components/core/LoadingState.vue';
import EmptyState from '@/components/core/EmptyState.vue';
import TextInput from '@/components/core/input/TextInput.vue';
import AppSelect from '@/components/core/input/AppSelect.vue';
import TablePager from '@/components/core/TablePager.vue';
import AuditEntryDetail from '@/components/audit/AuditEntryDetail.vue';
import { useAuditStore } from '@/store/core/audit';
import { useOrgUserStore } from '@/store/core/orgUser';
import { useAuthStore } from '@/store/core/auth';
import type { AuditLogEntry } from '@/data/audit/AuditDto';
import type { SelectOption } from '@/types/ui/common';

/**
 * Org audit log: PFS table, newest first, filterable by action substring,
 * entity type, and actor. Rows expand to the diff/comment payload.
 */
const { t } = useI18n();
const auditStore = useAuditStore();
const orgUserStore = useOrgUserStore();
const authStore = useAuthStore();

/**
 * Entity types the backend actually writes (extracted from AuditService.log
 * call sites). Silences are deliberately absent — personal preferences are
 * not audited.
 */
const ENTITY_TYPES = [
  'agent', 'api-key', 'domain', 'grafana-integration', 'group', 'invite',
  'notification-template', 'org', 'project', 'rule-preset', 'service',
  'user', 'webhook', 'webhook-binding', 'workspace',
];

const actionFilter = ref<string>('');
const entityFilter = ref<string>('');
const actorFilter = ref<string>('');
const expandedId = ref<string | null>(null);

const entityOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('audit.allEntities') },
  ...ENTITY_TYPES.map(type => ({ value: type, label: type })),
]);

const actorOptions = computed<SelectOption[]>(() => [
  { value: '', label: t('audit.allActors') },
  ...orgUserStore.users.map(u => ({ value: u.userId, label: `${u.displayName} (${u.email})` })),
]);

const timeFmt = new Intl.DateTimeFormat(undefined, {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
});

function formatTime(iso: string): string {
  return timeFmt.format(new Date(iso));
}

function actorLabel(entry: AuditLogEntry): string {
  if (entry.actorName) return entry.actorName;
  if (entry.actorEmail) return entry.actorEmail;
  return entry.userId ? entry.userId : t('audit.system');
}

function refetch() {
  void auditStore.fetchEntries(1, {
    action: actionFilter.value || undefined,
    entityType: entityFilter.value || undefined,
    actorUserId: actorFilter.value || undefined,
  });
}

let debounce: ReturnType<typeof setTimeout> | undefined;
watch(actionFilter, () => {
  clearTimeout(debounce);
  debounce = setTimeout(refetch, 300);
});
watch([entityFilter, actorFilter], refetch);

// A pending debounce must not fire after navigating away.
onUnmounted(() => clearTimeout(debounce));

onMounted(() => {
  refetch();
  // Actor filter needs the member list; skip silently without users.read.
  if (authStore.canRead('users')) {
    void orgUserStore.fetchUsers({ silent: true });
  }
});
</script>

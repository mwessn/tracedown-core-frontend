import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from '@/store/core/auth';
import { isFeatureEnabled } from '@/config/extensions';
import type { RouteLocationRaw } from 'vue-router';
import type { NavItem } from '@/types/ui/navigation';

interface Breadcrumb {
  label: string;
  to?: RouteLocationRaw;
}

/**
 * Navigation state: the ribbon items and the current view's breadcrumbs.
 *
 * Items are registered at startup (see `@/config/navigation` and `main.ts`)
 * and deduplicated by key — a later registration replaces an earlier one, so
 * default entries can be overridden.
 */
export const useNavigationStore = defineStore('navigation', () => {
  const navItems = ref<NavItem[]>([]);
  const breadcrumbs = ref<Breadcrumb[]>([]);
  /** Key of the ribbon item the current page belongs to (set from route meta). */
  const activeItemKey = ref<string | null>(null);

  /**
   * Ribbon items resolved against the user's permission matrix: an item shows
   * only when the user has read access to every section it lists. Ordered.
   */
  const visibleNavItems = computed(() => {
    const auth = useAuthStore();
    return navItems.value
      .filter(item =>
        item.access.every(section => auth.canRead(section))
        && (!item.anyAccess?.length || item.anyAccess.some(section => auth.canRead(section)))
        // A host may veto a whole surface via a feature gate (e.g. nothing left
        // to manage). Enabled by default, so un-extended Core never hides it.
        && (!item.feature || isFeatureEnabled(item.feature)))
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  });

  /** A ribbon with a single destination is noise — hide it entirely. */
  const showRibbon = computed(() => visibleNavItems.value.length > 1);

  function registerNavItems(items: NavItem[]) {
    for (const item of items) {
      const existing = navItems.value.findIndex(i => i.key === item.key);
      if (existing !== -1) {
        navItems.value.splice(existing, 1, item);
      } else {
        navItems.value.push(item);
      }
    }
  }

  function setActiveItem(key: string | null) {
    activeItemKey.value = key;
  }

  function setBreadcrumbs(value: Breadcrumb[]) {
    breadcrumbs.value = value;
  }

  function clearBreadcrumbs() {
    if (breadcrumbs.value.length) {
      breadcrumbs.value = [];
    }
  }

  return {
    navItems, breadcrumbs, activeItemKey, visibleNavItems, showRibbon,
    registerNavItems, setActiveItem, setBreadcrumbs, clearBreadcrumbs,
  };
});

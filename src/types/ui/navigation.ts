import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import type { RouteLocationRaw } from 'vue-router';
import type { AccessSection } from '@/types/access';

/**
 * An entry of the navigation ribbon, registered into the navigation store at
 * startup (see `@/config/navigation`).
 */
export interface NavItem {
  /** Unique key for deduplication across registrations. */
  key: string;
  /** i18n key for the display label. */
  label: string;
  route: RouteLocationRaw;
  icon: IconDefinition;
  /** Permission sections the user needs read access to (ALL of them). Empty = no AND requirement. */
  access: AccessSection[];
  /** If set, the user must have read on AT LEAST ONE of these (in addition to `access`). */
  anyAccess?: AccessSection[];
  /**
   * Optional feature-gate key. When a host vetoes this feature, the item is
   * hidden. Enabled by default, so un-extended Core never hides it.
   */
  feature?: string;
  /** Sort order (lower = higher). Default 0. */
  order?: number;
}

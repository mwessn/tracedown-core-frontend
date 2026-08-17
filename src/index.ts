// Public package API for host overlays. A consuming application builds ON TOP of
// this package via bootstrapApp + the extension registries — it never forks or
// re-implements the source.

export { bootstrapApp } from '@/app/bootstrap';
export type { BootstrapOptions } from '@/types/bootstrap';

// Adopt an externally-minted session token (host-driven auto-login).
export { establishSession } from '@/app/session';

export {
  registerSlot,
  getSlotComponents,
  setScriptEditor,
  registerFeatureGate,
  isFeatureEnabled,
  registerDeleteOrgHandler,
} from '@/config/extensions';
export type { FeatureContext } from '@/config/extensions';

export { registerPermissionSections, getPermissionSections } from '@/config/permissionSections';
export { DEFAULT_NAV_ITEMS } from '@/config/navigation';
export { useNavigationStore } from '@/store/ui/navigation';

// The configured API client and org store, for host stores/overlays.
export { http } from '@/config/requests';
export { useOrgStore } from '@/store/core/org';

export type { NavItem } from '@/types/ui/navigation';
export type { PermissionSectionDef, AccessSection } from '@/types/access';
export type { ActionResult, ActionDataResult } from '@/types/actions';

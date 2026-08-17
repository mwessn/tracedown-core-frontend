import type { PermissionSectionDef } from '@/types/access';

/**
 * The always-present permission sections. Their `labelKey`s reuse the
 * existing translations so the matrix renders identically.
 */
export const BUILTIN_SECTIONS: PermissionSectionDef[] = [
  { key: 'users', labelKey: 'nav.users' },
  { key: 'settings', labelKey: 'common.labels.settings' },
  { key: 'domains', labelKey: 'nav.domains' },
  { key: 'webhooks', labelKey: 'nav.webhooks' },
  { key: 'notifications', labelKey: 'nav.notifications' },
  { key: 'admin', labelKey: 'permissions.sectionAdmin' },
  { key: 'workspaces', labelKey: 'common.entities.workspaces' },
];

/** Sections registered at runtime by a host app, in registration order. */
const registered: PermissionSectionDef[] = [];

/**
 * Registers additional permission sections. Definitions are de-duplicated by
 * `key`; a later registration replaces an earlier one with the same key.
 */
export function registerPermissionSections(defs: PermissionSectionDef[]): void {
  for (const def of defs) {
    const existing = registered.findIndex(d => d.key === def.key);
    if (existing >= 0) {
      registered[existing] = def;
    } else {
      registered.push(def);
    }
  }
}

/** All permission sections: the built-in set followed by registered ones. */
export function getPermissionSections(): PermissionSectionDef[] {
  return [...BUILTIN_SECTIONS, ...registered];
}

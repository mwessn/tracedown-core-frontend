/**
 * The permission sections every organization membership always carries
 * (each is a numeric level: 0 none, 1 read, 2 write).
 */
export type BuiltinAccessSection =
  | 'users'
  | 'settings'
  | 'domains'
  | 'webhooks'
  | 'notifications'
  | 'admin'
  | 'workspaces';

/**
 * A permission section key. The built-in keys autocomplete, while any string
 * key registered by a host app is also accepted.
 */
export type AccessSection = BuiltinAccessSection | (string & {});

/**
 * The highest level a member's groups grant for one section, with the
 * granting group's name — "most permissive wins", so individual levels
 * below the floor have no effect.
 */
export interface SectionFloor {
  level: number;
  source: string;
}

/**
 * Describes one selectable row of the org-permission matrix.
 *
 * `key` is the wire key exchanged with the backend (a numeric 0/1/2 level).
 * `labelKey` is the i18n key used to render the row label.
 * `group` is an optional free-form tag a host app can use to cluster rows.
 */
export interface PermissionSectionDef {
  key: AccessSection;
  labelKey: string;
  group?: string;
}

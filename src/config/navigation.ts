import { faClipboardList, faGauge, faGear, faServer, faUsers } from '@fortawesome/free-solid-svg-icons';
import type { NavItem } from '@/types/ui/navigation';

/**
 * Built-in navigation ribbon items, registered into the navigation store at
 * startup. Further items can be registered the same way.
 *
 * Org admin surface splits in two: **Settings** holds the high-trust General
 * tab (`admin`) plus operational tabs, while **Infrastructure** groups the
 * DevOps config surfaces (webhooks, notifications, org variables, domains),
 * each gated by its own permission. Both use `anyAccess` so a user who holds
 * any one of the grouped permissions sees the entry.
 */
export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    key: 'home',
    label: 'nav.home',
    icon: faGauge,
    route: { name: 'home' },
    access: [],
    order: 0,
  },
  {
    key: 'users',
    label: 'nav.users',
    icon: faUsers,
    route: { name: 'org-users' },
    access: ['users'],
    feature: 'user-management',
    order: 30,
  },
  {
    key: 'infrastructure',
    label: 'nav.infrastructure',
    icon: faServer,
    route: { name: 'infrastructure' },
    access: [],
    anyAccess: ['webhooks', 'notifications', 'settings', 'domains'],
    order: 50,
  },
  {
    key: 'audit',
    label: 'nav.audit',
    icon: faClipboardList,
    route: { name: 'audit' },
    access: ['settings'],
    order: 70,
  },
  {
    key: 'settings',
    label: 'common.labels.settings',
    icon: faGear,
    route: { name: 'settings' },
    access: [],
    anyAccess: ['admin', 'settings'],
    order: 100,
  },
];

import type { SelectOption } from '@/types/ui/common';

/**
 * IANA timezone list from the runtime (no bundled database). Sorted; UTC
 * first since it's both the platform default and the most common pick.
 */
export const TIMEZONE_OPTIONS: SelectOption[] = [
  { value: 'UTC', label: 'UTC' },
  ...Intl.supportedValuesOf('timeZone')
    .filter(zone => zone !== 'UTC')
    .map(zone => ({ value: zone, label: zone })),
];

/** The browser's current IANA timezone. */
export const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

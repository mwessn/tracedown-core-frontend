import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

/** A tab entry for TabBar. `label` is already translated. */
export interface DisplayTab {
  key: string;
  label: string;
  icon?: IconDefinition;
  /** Hidden when explicitly false (e.g. settings without write access). */
  visible?: boolean;
}

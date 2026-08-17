// Search

export interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
  to?: string;
  icon?: string;
  payload?: unknown;
}

// Notifications

export type UiMessageType = 'error' | 'success' | 'warning';

export interface UiMessage {
  id: string;
  text: string;
  type: UiMessageType;
}

// Select

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
  /** Native tooltip, e.g. explaining why the option is disabled. */
  title?: string;
}

// Assignment pickers

/** One assignable item in a PillPicker card (available pill / assigned row). */
export interface PillItem {
  id: string;
  label: string;
}

/**
 * Configurable success rate color thresholds.
 *
 * Each entry defines a `from` percentage and a `color` (CSS color value).
 * The default entry (no `from`) applies from 0% up to the first threshold.
 * Entries are evaluated from highest `from` to lowest — the first match wins.
 *
 * Example: [ { color: '#ef4444' }, { from: 70, color: '#eab308' }, { from: 95, color: '#22c55e' } ]
 * means: 0–69.9% → red, 70–94.9% → yellow, 95–100% → green
 */
interface SuccessRateThreshold {
  from?: number;
  color: string;
}

const DEFAULT_THRESHOLDS: SuccessRateThreshold[] = [
  { from: 99, color: 'var(--color-status-success)' },
  { from: 95, color: 'var(--color-status-warning)' },
  { color: 'var(--color-status-failure)' },
];

let thresholds: SuccessRateThreshold[] = DEFAULT_THRESHOLDS;

/** Replaces the active thresholds. Entries are sorted by `from` descending internally. */
export function setSuccessRateThresholds(t: SuccessRateThreshold[]) {
  thresholds = [...t].sort((a, b) => (b.from ?? -1) - (a.from ?? -1));
}

/** Returns the current thresholds (for display in settings). */
export function getSuccessRateThresholds(): SuccessRateThreshold[] {
  return thresholds;
}

/** Resolves the CSS color for a given success rate (0–100 scale). */
export function successRateColor(rate: number): string {
  for (const t of thresholds) {
    if (t.from != null && rate >= t.from) return t.color;
  }
  const def = thresholds.find(t => t.from == null);
  return def?.color ?? 'var(--color-status-failure)';
}

/**
 * Returns an inline style object for text color based on success rate.
 * Use with `:style="successRateStyle(rate)"` in templates.
 */
export function successRateStyle(rate: number | null): Record<string, string> {
  if (rate == null) return {};
  return { color: successRateColor(rate) };
}

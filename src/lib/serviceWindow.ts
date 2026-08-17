/**
 * Minimal service-window model: one recurring range with minute precision,
 * daily or on selected weekdays. Encoded as `RRULE/durationMinutes[/tz]` —
 * the scheduler opens a window of the given length at each occurrence — e.g.
 * daily 02:30–04:45 → `FREQ=DAILY;BYHOUR=2;BYMINUTE=30/135`. Ranges may
 * cross midnight (23:00–01:00 → duration 120). The optional trailing IANA
 * timezone (which itself contains slashes) sets the clock the rule reads;
 * omitted means the org's default timezone.
 *
 * Legacy hour-tiled rules without a duration (`BYHOUR=2,3,4`, one hour per
 * occurrence) still parse. Anything else set via the API is treated as
 * "custom" by the UI and left untouched unless replaced.
 */

export type WindowFrequency = 'daily' | 'weekly';
export type WindowDay = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

export interface WindowTime {
  hours: number;
  minutes: number;
}

interface ServiceWindowConfig {
  frequency: WindowFrequency;
  /** Weekly only; non-empty, in week order. */
  days: WindowDay[];
  start: WindowTime;
  /** May be "before" start, meaning the window crosses midnight. */
  end: WindowTime;
  /** IANA zone the clock fields evaluate in; null = org default. */
  timezone: string | null;
}

export const WINDOW_DAYS: WindowDay[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

const KNOWN_KEYS = ['FREQ', 'BYDAY', 'BYHOUR', 'BYMINUTE'];
const DAY_MINUTES = 24 * 60;

function toMinutes(time: WindowTime): number {
  return time.hours * 60 + time.minutes;
}

/** Window length in minutes; an end at or before the start wraps to the next day. */
export function windowDuration(start: WindowTime, end: WindowTime): number {
  const diff = toMinutes(end) - toMinutes(start);
  return diff > 0 ? diff : diff + DAY_MINUTES;
}

export function buildServiceWindowRule(config: ServiceWindowConfig): string {
  const parts = [`FREQ=${config.frequency === 'weekly' ? 'WEEKLY' : 'DAILY'}`];
  if (config.frequency === 'weekly') {
    const days = WINDOW_DAYS.filter(day => config.days.includes(day));
    parts.push(`BYDAY=${days.join(',')}`);
  }
  parts.push(`BYHOUR=${config.start.hours}`, `BYMINUTE=${config.start.minutes}`);
  const base = `${parts.join(';')}/${windowDuration(config.start, config.end)}`;
  return config.timezone ? `${base}/${config.timezone}` : base;
}

/** Returns null for anything the minimal UI model can't represent. */
export function parseServiceWindowRule(rule: string | null | undefined): ServiceWindowConfig | null {
  if (!rule) return null;

  // Split as rrule / duration / rest — timezone names contain slashes.
  const segments = rule.split('/');
  const rrulePart = segments[0];
  let duration: number | null = null;
  if (segments.length > 1) {
    duration = Number(segments[1]);
    if (!Number.isInteger(duration) || duration < 1 || duration > 1440) return null;
  }
  const timezone = segments.length > 2 ? segments.slice(2).join('/') : null;

  const fields = new Map<string, string>();
  for (const part of rrulePart.split(';')) {
    const [key, value] = part.split('=');
    if (!key || value === undefined) return null;
    fields.set(key.toUpperCase(), value);
  }
  for (const key of fields.keys()) {
    if (!KNOWN_KEYS.includes(key)) return null;
  }

  const freq = fields.get('FREQ');
  if (freq !== 'DAILY' && freq !== 'WEEKLY') return null;

  const minutes = Number(fields.get('BYMINUTE') ?? '0');
  if (!Number.isInteger(minutes) || minutes < 0 || minutes > 59) return null;

  const dayValue = fields.get('BYDAY');
  const days = dayValue === undefined ? [] : dayValue.split(',') as WindowDay[];
  if (freq === 'WEEKLY' && (days.length === 0 || days.some(day => !WINDOW_DAYS.includes(day)))) return null;
  if (freq === 'DAILY' && dayValue !== undefined) return null;

  const hoursValue = fields.get('BYHOUR');
  if (!hoursValue) return null;
  const hours = hoursValue.split(',').map(Number);
  if (hours.length === 0 || hours.some(h => !Number.isInteger(h) || h < 0 || h > 23)) return null;

  if (duration === null) {
    // Legacy hour-tiled encoding: contiguous hours, one hour per occurrence.
    const sorted = [...hours].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[0] + i) return null;
    }
    duration = sorted.length * 60;
    hours.splice(0, hours.length, sorted[0]);
  } else if (hours.length !== 1) {
    return null;
  }

  const start: WindowTime = { hours: hours[0], minutes };
  const endTotal = (toMinutes(start) + duration) % DAY_MINUTES;
  return {
    frequency: freq === 'WEEKLY' ? 'weekly' : 'daily',
    days: WINDOW_DAYS.filter(day => days.includes(day)),
    start,
    end: { hours: Math.floor(endTotal / 60), minutes: endTotal % 60 },
    timezone,
  };
}

export function formatWindowTime(time: WindowTime): string {
  return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
}

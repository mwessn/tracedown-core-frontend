/**
 * Model for the most-failing-assertions panel.
 *
 * The API sends an assertion in parts — the declared side of it, never what the
 * target answered — and deliberately builds no display string. The subject
 * assembled here is the script's own vocabulary (`status eq 200`), which is
 * what the author wrote and what they will search their script for; the
 * sentence around it is the component's i18n.
 */

import type { AssertionStat } from '@/data/metrics/MetricsDto';

export interface AssertionRow {
  /** Stable list key: the identity the API grouped by. */
  id: string;
  method: string;
  template: string;
  endpointKey: string;
  /** `expect` | `check` | `assert`, verbatim. */
  assertionMethod: string;
  /** `status eq 200`, or an `assert` condition's expression; `""` when neither applies. */
  subject: string;
  failures: number;
  evaluations: number;
  failureRatePct: number;
  lastFailedAt: string;
  /** Bar width 0..100, against the worst row — this is a ranking, not a rate. */
  sharePct: number;
}

/**
 * The declared assertion, in one line.
 *
 * A scope assertion reads `<scope> <op> <expected>`; an `assert` condition is
 * its own expression, with the condition kind in front of it when the
 * expression is missing. A part that does not apply is null and simply absent.
 */
export function assertionSubject(stat: AssertionStat): string {
  const parts = stat.scope != null
    ? [stat.scope, stat.op, stat.expected]
    : [stat.expression ?? stat.kind];
  return parts.filter((part): part is string => part != null && part !== '').join(' ');
}

/** The rows of the panel, in API order (failures descending) with their bar widths. */
export function buildAssertionRows(assertions: readonly AssertionStat[]): AssertionRow[] {
  const worst = assertions.reduce((max, a) => Math.max(max, a.failures), 0);
  return assertions.map(stat => ({
    id: [
      stat.endpointKey, stat.assertionMethod, stat.scope, stat.op,
      stat.expected, stat.kind, stat.expression,
    ].join('\u0000'),
    method: stat.method,
    template: stat.template,
    endpointKey: stat.endpointKey,
    assertionMethod: stat.assertionMethod,
    subject: assertionSubject(stat),
    failures: stat.failures,
    evaluations: stat.evaluations,
    failureRatePct: stat.failureRatePct,
    lastFailedAt: stat.lastFailedAt,
    sharePct: worst > 0 ? (stat.failures / worst) * 100 : 0,
  }));
}

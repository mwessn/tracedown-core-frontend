import type { ParsedAssertion } from '@/data/results/ResultDto';

/** Normalizes the raw `assertionResults` JSON of a probe step. */
export function parseAssertions(raw: unknown): ParsedAssertion[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((a: Record<string, unknown>) => ({
    scope: String(a.scope ?? ''),
    op: String(a.op ?? ''),
    expected: String(a.expected ?? ''),
    actual: String(a.actual ?? ''),
    outcome: String(a.outcome ?? ''),
  }));
}

import { describe, expect, it } from 'vitest';
import { assertionSubject, buildAssertionRows } from '@/utils/assertionStats';
import type { AssertionStat } from '@/data/metrics/MetricsDto';

function stat(over: Partial<AssertionStat> = {}): AssertionStat {
  return {
    endpointKey: 'GET {p.baseUrl}/orders',
    method: 'GET',
    template: '{p.baseUrl}/orders',
    assertionMethod: 'expect',
    scope: 'status',
    op: 'eq',
    expected: '200',
    kind: null,
    expression: null,
    failures: 12,
    evaluations: 1440,
    failureRatePct: 0.83,
    lastFailedAt: '2026-09-20T11:04:00Z',
    ...over,
  };
}

describe('assertionSubject', () => {
  it('reads a scope assertion back as the script wrote it', () => {
    expect(assertionSubject(stat())).toBe('status eq 200');
    expect(assertionSubject(stat({ scope: 'body.total', op: 'gt', expected: '0' }))).toBe('body.total gt 0');
  });

  it('is the expression of an assert condition', () => {
    expect(assertionSubject(stat({
      scope: null, op: null, expected: null,
      assertionMethod: 'assert', kind: 'json', expression: '$.items.length > 0',
    }))).toBe('$.items.length > 0');
  });

  it('falls back to the condition kind when there is no expression', () => {
    expect(assertionSubject(stat({
      scope: null, op: null, expected: null,
      assertionMethod: 'assert', kind: 'schema', expression: null,
    }))).toBe('schema');
  });

  it('drops the parts that do not apply rather than printing gaps', () => {
    expect(assertionSubject(stat({ op: null, expected: null }))).toBe('status');
    expect(assertionSubject(stat({ scope: null, kind: null, expression: null }))).toBe('');
  });
});

describe('buildAssertionRows', () => {
  it('keeps the API ranking', () => {
    const rows = buildAssertionRows([
      stat({ failures: 12 }),
      stat({ endpointKey: 'POST {p.baseUrl}/login', failures: 3 }),
    ]);
    expect(rows.map(r => r.failures)).toEqual([12, 3]);
  });

  it('measures every bar against the worst row', () => {
    const rows = buildAssertionRows([stat({ failures: 12 }), stat({ scope: 'body', failures: 3 })]);
    expect(rows[0].sharePct).toBe(100);
    expect(rows[1].sharePct).toBe(25);
  });

  it('gives two assertions of one endpoint distinct keys', () => {
    const rows = buildAssertionRows([
      stat({ scope: 'status', expected: '200' }),
      stat({ scope: 'status', expected: '201' }),
    ]);
    expect(rows[0].id).not.toBe(rows[1].id);
  });

  it('carries the counts and the last failure through untouched', () => {
    const [row] = buildAssertionRows([stat()]);
    expect(row.evaluations).toBe(1440);
    expect(row.failureRatePct).toBe(0.83);
    expect(row.lastFailedAt).toBe('2026-09-20T11:04:00Z');
    expect(row.subject).toBe('status eq 200');
  });

  it('is empty for a window in which nothing failed', () => {
    expect(buildAssertionRows([])).toEqual([]);
  });
});

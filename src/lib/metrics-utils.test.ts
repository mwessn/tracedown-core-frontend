import { describe, expect, it } from 'vitest';
import { formatBytes, formatMs } from '@/lib/metrics-utils';

describe('formatMs', () => {
  it('stays in milliseconds under a second, rounded', () => {
    expect(formatMs(0)).toBe('0ms');
    expect(formatMs(82)).toBe('82ms');
    expect(formatMs(840.4)).toBe('840ms');
    expect(formatMs(999.4)).toBe('999ms');
  });

  it('switches to seconds with two decimals at a second', () => {
    expect(formatMs(1000)).toBe('1.00s');
    expect(formatMs(1120)).toBe('1.12s');
    expect(formatMs(1240)).toBe('1.24s');
    expect(formatMs(65000)).toBe('65.00s');
  });
});

describe('formatBytes', () => {
  it('stays in bytes below a kilobyte', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(842)).toBe('842 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('climbs the binary units', () => {
    expect(formatBytes(1024)).toBe('1.00 KB');
    expect(formatBytes(1536)).toBe('1.50 KB');
    expect(formatBytes(3.45 * 1024 * 1024)).toBe('3.45 MB');
    expect(formatBytes(1024 ** 3)).toBe('1.00 GB');
    expect(formatBytes(1024 ** 4)).toBe('1.00 TB');
  });

  it('drops decimals as the number grows, so a tick stays short', () => {
    expect(formatBytes(12 * 1024)).toBe('12.0 KB');
    expect(formatBytes(512 * 1024)).toBe('512 KB');
  });

  it('stops at terabytes rather than inventing a unit', () => {
    expect(formatBytes(2048 * 1024 ** 4)).toBe('2048 TB');
  });
});

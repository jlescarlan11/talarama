// @vitest-environment node
import { expect, it } from 'vitest';
import { retentionAction, guardRetentionDatabase, fingerprint } from '@/scripts/lib/tmdb-retention-policy';

const now = new Date('2026-10-19T12:00:00Z');
const ago = (days: number) => new Date(+now - days * 86400000);

it('refreshes at150 and retires on failed refresh at180 elapsed days, with exact boundaries', () => {
  expect(retentionAction(ago(149.999), 'PROVIDER', 'scheduled', now)).toBe('KEEP');
  expect(retentionAction(ago(150), 'PROVIDER', 'scheduled', now)).toBe('REFRESH');
  expect(retentionAction(ago(179.999), 'PROVIDER', 'scheduled', now)).toBe('REFRESH');
  expect(retentionAction(ago(180), 'PROVIDER', 'scheduled', now)).toBe('REFRESH_OR_RETIRE');
});
it('does not guess legacy ownership or unknown/null/future dates and termination never refreshes', () => {
  expect(retentionAction(ago(200), 'LEGACY', 'scheduled', now)).toBe('KEEP_LEGACY');
  expect(retentionAction(ago(200), 'UNKNOWN', 'scheduled', now)).toBe('REVIEW');
  for (const date of [null, new Date(NaN), ago(-1)]) expect(retentionAction(date, 'PROVIDER', 'scheduled', now)).toBe('REVIEW');
  expect(retentionAction(ago(1), 'PROVIDER', 'termination', now)).toBe('RETIRE');
  expect(retentionAction(null, 'RETIRED', 'scheduled', now)).toBe('RECOVER');
  expect(retentionAction(null, 'RETIRED', 'termination', now)).toBe('RETIRE');
  expect(retentionAction(null, 'TERMINATED', 'scheduled', now)).toBe('KEEP_TERMINATED');
});
it('only accepts loopback disposable _test DBs without an existing schema', () => {
  for (const url of ['postgresql://u:secret@remote.invalid/db_test','postgresql://u:secret@localhost/db_dev','postgresql://u:secret@localhost/db_test?schema=public','postgresql://u:secret@localhost/db_test?schema=retention_123','not a URL']) {
    expect(() => guardRetentionDatabase(url)).toThrow('loopback _test');
    try { guardRetentionDatabase(url); } catch (error) { expect(String(error)).not.toContain('secret'); }
  }
  expect(() => guardRetentionDatabase('postgresql://u:secret@127.0.0.1:55439/talarama_test')).not.toThrow();
});
it('fingerprints metadata canonically without retaining plaintext in reports', () => {
  expect(fingerprint({ b: ['x'], a: 1 })).toBe(fingerprint({ a: 1, b: ['x'] }));
  expect(fingerprint({ a: 'provider title' })).toMatch(/^[a-f0-9]{64}$/);
  expect(fingerprint({ a: 'provider title' })).not.toBe(fingerprint({ a: 'new title' }));
});

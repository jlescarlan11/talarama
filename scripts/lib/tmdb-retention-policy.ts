import { createHash } from 'node:crypto';

export type RetentionMode = 'scheduled' | 'termination';
export type Ownership = 'PROVIDER' | 'RETIRED' | 'TERMINATED' | 'LEGACY' | 'UNKNOWN';
export const DAY_MS = 86400000;
export const REFRESH_DAYS = 150;
export const EXPIRE_DAYS = 180;

export function retentionAction(fetchedAt: Date | null, ownership: Ownership, mode: RetentionMode, now: Date) {
  if (!Number.isFinite(+now)) throw new Error('Invalid retention clock');
  if (ownership === 'LEGACY') return 'KEEP_LEGACY';
  if (ownership === 'UNKNOWN') return 'REVIEW';
  if (ownership === 'TERMINATED') return 'KEEP_TERMINATED';
  if (ownership === 'RETIRED') return mode === 'termination' ? 'RETIRE' : 'RECOVER';
  if (mode === 'termination') return 'RETIRE';
  if (!fetchedAt || !Number.isFinite(+fetchedAt) || +fetchedAt > +now) return 'REVIEW';
  const age = (+now - +fetchedAt) / DAY_MS;
  return age >= EXPIRE_DAYS ? 'REFRESH_OR_RETIRE' : age >= REFRESH_DAYS ? 'REFRESH' : 'KEEP';
}

/** No existing schema override, forwarded host option, dev DB or production escape hatch. */
export function guardRetentionDatabase(raw: string): URL {
  try {
    const url = new URL(raw);
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)
      || !/^\/[a-zA-Z0-9_]+_test$/.test(decodeURIComponent(url.pathname)) || url.search || url.hash) throw new Error();
    return url;
  } catch { throw new Error('Retention rehearsal requires a loopback _test database URL without query parameters'); }
}

function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, canonical(item)]));
  return value;
}
export function fingerprint(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

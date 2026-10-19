import { open } from 'node:fs/promises';
/** CLI access is deliberately limited to loopback development/test databases. No production override. */
export function guardCatalogDatabase() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('Set a local development DATABASE_URL');
  const url = new URL(raw);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !/_(dev|test)$/.test(decodeURIComponent(url.pathname))) throw new Error('Catalog tooling requires a loopback database ending in _dev or _test');
  if (process.env.DIRECT_URL) {
    const direct = new URL(process.env.DIRECT_URL);
    if (direct.hostname !== url.hostname || direct.port !== url.port || direct.pathname !== url.pathname || direct.search !== url.search) throw new Error('DIRECT_URL must identify the same local database/schema');
  }
}
export async function reserveOutput(path) {
  if (!path) throw new Error('An explicit new output path is required');
  return open(path, 'wx', 0o600);
}

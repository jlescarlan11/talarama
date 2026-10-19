// @vitest-environment node
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { it, expect, vi } from 'vitest';
import { guardCatalogDatabase, reserveOutput } from '@/scripts/catalog-runner.mjs';
it('rejects remote/production databases and differing direct URLs without disclosing secrets', () => {
  try {
    vi.stubEnv('DIRECT_URL', '');
    for (const url of ['postgresql://user:secret@remote.example/catalog_dev', 'postgresql://user:secret@localhost/catalog', 'postgresql://user:secret@localhost/catalog_prod']) {
      vi.stubEnv('DATABASE_URL', url);
      expect(guardCatalogDatabase).toThrow('loopback database');
    }
    vi.stubEnv('DATABASE_URL', 'postgresql://user:secret@127.0.0.1/catalog_test');
    expect(guardCatalogDatabase).not.toThrow();
    vi.stubEnv('DIRECT_URL', 'postgresql://user:secret@127.0.0.1/other_dev');
    expect(guardCatalogDatabase).toThrow('same local database');
  } finally { vi.unstubAllEnvs(); }
});
it('reserves an exclusive output before writes and refuses existing files', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'talarama-audit-'));
  const path = join(directory, 'audit.jsonl');
  try {
    const handle = await reserveOutput(path);
    await handle.writeFile('retained'); await handle.close();
    await expect(reserveOutput(path)).rejects.toMatchObject({ code: 'EEXIST' });
    expect(await readFile(path, 'utf8')).toBe('retained');
  } finally { await rm(directory, { recursive: true, force: true }); }
});

import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { TmdbClient } from '../app/lib/tmdb/client';
import { applyMappings, mappingManifest } from '../app/services/catalogMappingService';
import { guardCatalogDatabase, reserveOutput } from './catalog-runner.mjs';

async function main() {
  guardCatalogDatabase();
  const [flag, manifestPath, auditPath, ...extra] = process.argv.slice(2);
  if (flag !== '--reviewed' || !manifestPath || !auditPath || extra.length) throw new Error('Usage: npm run catalog:apply -- --reviewed reviewed.json new-audit.json');
  const text = await readFile(manifestPath, 'utf8');
  if (text.length > 1_000_000) throw new Error('Manifest too large');
  const manifest = mappingManifest.parse(JSON.parse(text));
  // Reserve and fsync a journal before DB changes. The committed database audit survives export failures.
  const file = await reserveOutput(auditPath);
  const db = new PrismaClient();
  let committed = false;
  try {
    await file.writeFile(JSON.stringify({ state: 'PREPARED', manifest }) + '\n'); await file.sync();
    const audit = await applyMappings(manifest, { db, provider: new TmdbClient() });
    committed = true;
    await file.writeFile(JSON.stringify({ state: 'COMMITTED', audit }) + '\n'); await file.sync();
    console.log(`Reviewed mapping committed; audit ${audit.id}. Existing metadata and relationships retained.`);
  } catch {
    console.error(committed ? 'Mapping committed; audit export failed. Recover the durable CatalogMappingAudit row before retrying.' : 'Mapping failed; transaction rolled back. Review configuration and mappings.');
    process.exitCode = 1;
  } finally { await file.close(); await db.$disconnect(); }
}
main().catch(() => { console.error('Apply refused before transaction; check reviewed manifest, local database guard and new audit path.'); process.exitCode = 1; });

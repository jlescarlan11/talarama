import { PrismaClient } from '@prisma/client';
import { TmdbClient } from '../app/lib/tmdb/client';
import { matchCatalog } from '../app/services/catalogMappingService';
import { guardCatalogDatabase, reserveOutput } from './catalog-runner.mjs';

async function main() {
  guardCatalogDatabase();
  const [output, ...extra] = process.argv.slice(2);
  if (extra.length) throw new Error('Usage: npm run catalog:match -- new-report.json');
  const file = await reserveOutput(output);
  const db = new PrismaClient();
  try {
    const movies = await db.movie.findMany({ where: { tmdbId: null }, select: { id: true, title: true, releasedYear: true }, orderBy: { id: 'asc' }, take: 1001 });
    if (movies.length > 1000) throw new Error('Catalog exceeds 1000 rows; prepare a scoped reviewed batch');
    const report = await matchCatalog(movies, new TmdbClient());
    await file.writeFile(JSON.stringify(report, null, 2));
    await file.sync();
    console.log(`Dry run: ${movies.length} local rows; no catalog writes. Review the report manually.`);
  } finally { await file.close(); await db.$disconnect(); }
}
main().catch(() => { console.error('Catalog match failed; check local configuration/provider and use a new report path. No catalog rows were changed.'); process.exitCode = 1; });

import { readFile } from 'node:fs/promises';
import { PrismaClient } from '@prisma/client';
import { previewLegacyDates } from '../app/lib/diary/legacy-dates';
import { applyReviewedDates, dateManifest } from '../app/services/diaryDateMigrationService';
import { guardCatalogDatabase, reserveOutput } from './catalog-runner.mjs';
async function main() {
    guardCatalogDatabase();
    const [mode, path, auditPath, ...extra] = process.argv.slice(2);
    if (extra.length || !path || !['preview', '--reviewed'].includes(mode) || (mode === 'preview' && auditPath) || (mode === '--reviewed' && !auditPath))
        throw Error('Invalid arguments');
    const db = new PrismaClient();
    try {
        if (mode === 'preview') {
            const file = await reserveOutput(path);
            try {
                const entries = await db.diaryEntry.findMany({ include: { user: { select: { timeZone: true } } }, orderBy: { id: 'asc' }, take: 1001 });
                if (entries.length > 1000)
                    throw Error('More than 1000 entries: use a separately reviewed batched export');
                await file.writeFile(JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), rows: previewLegacyDates(entries) }, null, 2));
                await file.sync();
                console.log(`Preview exported: ${entries.length} originals; no diary writes.`);
            }
            finally {
                await file.close();
            }
        }
        else {
            const text = await readFile(path, 'utf8');
            if (text.length > 1000000)
                throw Error('Manifest too large');
            const manifest = dateManifest.parse(JSON.parse(text));
            const file = await reserveOutput(auditPath!);
            let committed = false;
            try {
                await file.writeFile(JSON.stringify({ state: 'PREPARED', manifest }) + '\n');
                await file.sync();
                const audit = await applyReviewedDates(manifest, { db });
                committed = true;
                await file.writeFile(JSON.stringify({ state: 'COMMITTED', audit }) + '\n');
                await file.sync();
                console.log(`Reviewed dates committed: ${audit.length}.`);
            }
            catch {
                console.error(committed ? 'Dates committed; audit export failed. Compare manifest originals to DB before retrying.' : 'Apply failed; inspect originals and DB to resolve an uncertain commit outcome before retrying.');
                process.exitCode = 1;
            }
            finally {
                await file.close();
            }
        }
    }
    finally {
        await db.$disconnect();
    }
}
main().catch(() => { console.error('Date operation refused. Check local DB guard, mode, reviewed manifest and exclusive output path.'); process.exitCode = 1; });

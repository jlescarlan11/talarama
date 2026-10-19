import 'server-only';
import { z } from 'zod';
import type { PrismaClient } from '@prisma/client';
import { parseCalendarDate } from '@/app/lib/diary/dates';
export const dateManifest = z.object({ version: z.literal(1), reviewedBy: z.string().trim().min(1).max(200), mappings: z.array(z.object({ id: z.string().min(1).max(200), original: z.string().datetime(), date: z.string().refine(value => !!parseCalendarDate(value)) }).strict()).min(1).max(1000) }).strict().refine(value => new Set(value.mappings.map(row => row.id)).size === value.mappings.length, 'Duplicate entries');
/** Operator-only. Never invoked by web reads, schema migrations or browser initialization. */
export async function applyReviewedDates(value: unknown, { db }: {
    db: PrismaClient;
}) {
    const manifest = dateManifest.parse(value);
    return db.$transaction(async (tx) => {
        const audit = [];
        for (const row of manifest.mappings) {
            const entry = await tx.diaryEntry.findUnique({ where: { id: row.id }, select: { watchedDate: true, updatedAt: true } });
            if (!entry || entry.watchedDate.toISOString() !== new Date(row.original).toISOString())
                throw new Error('Stale or missing original timestamp');
            const updated = await tx.diaryEntry.updateMany({ where: { id: row.id, watchedDate: entry.watchedDate, updatedAt: entry.updatedAt }, data: { watchedDate: parseCalendarDate(row.date)! } });
            if (updated.count !== 1)
                throw new Error('Entry changed since preview');
            audit.push({ ...row, normalized: parseCalendarDate(row.date)!.toISOString() });
        }
        return audit;
    });
}

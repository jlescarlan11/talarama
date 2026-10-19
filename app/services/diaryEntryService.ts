import 'server-only';
import prisma from '@/prisma/client';
import { Prisma, type PrismaClient } from '@prisma/client';
import { diaryEntrySchema, type DiaryInput } from '@/app/lib/diary/contracts';
import { calendarDate, parseCalendarDate, validateWatchedDate } from '@/app/lib/diary/dates';
import { removeLoggedMovie } from './watchlistService';
export class DiaryError extends Error {
    constructor(message: string, public status: number) { super(message); }
}
export const serializeEntry = <T extends {
    watchedDate: Date;
}>(entry: T) => ({ ...entry, watchedDate: calendarDate(entry.watchedDate) });
async function dataFor(userId: string, input: DiaryInput, db: Prisma.TransactionClient) {
    const data = diaryEntrySchema.parse(input);
    const user = await db.user.findUnique({ where: { id: userId }, select: { timeZone: true } });
    if (!user)
        throw new DiaryError('User not found', 404);
    if (!validateWatchedDate(data.watchedDate, user.timeZone))
        throw new DiaryError('Watched date cannot be in the future in your saved timezone', 400);
    if (!await db.movie.findUnique({ where: { id: data.movieId }, select: { id: true } }))
        throw new DiaryError('Movie not found', 404);
    return { ...data, watchedDate: parseCalendarDate(data.watchedDate)! };
}
export async function createDiaryEntry(userId: string, input: DiaryInput, { db = prisma }: {
    db?: PrismaClient;
} = {}) {
    const key = { userId_clientRequestId: { userId, clientRequestId: input.clientRequestId } };
    const replay = await db.diaryEntry.findUnique({ where: key });
    if (replay)
        return { entry: serializeEntry(replay), replayed: true };
    try {
        const entry = await db.$transaction(async (tx) => {
            const data = await dataFor(userId, input, tx);
            const entry = await tx.diaryEntry.create({ data: { ...data, userId } });
            await removeLoggedMovie(tx, userId, data.movieId);
            return entry;
        });
        return { entry: serializeEntry(entry), replayed: false };
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            const entry = await db.diaryEntry.findUnique({ where: key });
            if (entry)
                return { entry: serializeEntry(entry), replayed: true };
        }
        throw error;
    }
}
export async function updateDiaryEntry(userId: string, id: string, input: DiaryInput, { db = prisma }: {
    db?: PrismaClient;
} = {}) {
    return db.$transaction(async (tx) => {
        const existing = await tx.diaryEntry.findFirst({ where: { id, userId } });
        if (!existing)
            throw new DiaryError('Diary entry not found', 404);
        const { clientRequestId: _requestId, ...data } = await dataFor(userId, input, tx);
        void _requestId;
        // A review/rating edit is not authorization to reinterpret an old timestamp.
        if (input.watchedDate === calendarDate(existing.watchedDate)) data.watchedDate = existing.watchedDate;
        const updated = await tx.diaryEntry.updateMany({ where: { id, userId, movieId: existing.movieId, watchedDate: existing.watchedDate }, data });
        if (!updated.count)
            throw new DiaryError('This viewing changed while saving. Please retry.', 409);
        // Review/date edits and PATCH retries must preserve a later watchlist intent.
        if (existing.movieId !== data.movieId) await removeLoggedMovie(tx, userId, data.movieId);
        const entry = await tx.diaryEntry.findFirst({ where: { id, userId } });
        if (!entry)
            throw new DiaryError('Diary entry not found', 404);
        return serializeEntry(entry);
    });
}
export async function deleteDiaryEntry(userId: string, id: string, { db = prisma }: {
    db?: PrismaClient;
} = {}) {
    const result = await db.diaryEntry.deleteMany({ where: { id, userId } });
    if (!result.count)
        throw new DiaryError('Diary entry not found', 404);
}
export interface DiaryFilters {
    q?: string;
    year?: number;
    rating?: number | 'unrated';
    cursor?: string;
}
export function parseDiaryFilters(params: URLSearchParams): DiaryFilters {
    const q = (params.get('q') ?? '').trim();
    const year = params.get('year');
    const rating = params.get('rating');
    const cursor = params.get('cursor') ?? undefined;
    if (q.length > 200 || (year && (!/^\d{4}$/.test(year) || Number(year) < 1 || Number(year) > 9998)) || (rating && !/^(unrated|[1-5])$/.test(rating)) || (cursor && cursor.length > 1000))
        throw new DiaryError('Invalid diary filters', 400);
    return { q: q || undefined, year: year ? Number(year) : undefined, rating: rating === 'unrated' ? 'unrated' : rating ? Number(rating) : undefined, cursor };
}
export async function listDiaryEntries(userId: string, filters: DiaryFilters = {}, { db = prisma }: {
    db?: PrismaClient;
} = {}) {
    const where: Prisma.DiaryEntryWhereInput = { userId, ...(filters.q ? { movie: { title: { contains: filters.q, mode: 'insensitive' } } } : {}), ...(filters.year ? { watchedDate: { gte: new Date(`${String(filters.year).padStart(4, '0')}-01-01T00:00:00Z`), lt: new Date(`${String(filters.year + 1).padStart(4, '0')}-01-01T00:00:00Z`) } } : {}), ...(filters.rating ? { rating: filters.rating === 'unrated' ? null : filters.rating } : {}) };
    let boundary: Prisma.DiaryEntryWhereInput = {};
    if (filters.cursor) {
        let value: {
            id: string;
            date: string;
        };
        try {
            value = JSON.parse(Buffer.from(filters.cursor, 'base64url').toString());
            if (typeof value.id !== 'string' || value.id.length > 200 || !Number.isFinite(new Date(value.date).getTime()))
                throw Error();
        }
        catch {
            throw new DiaryError('Invalid diary cursor', 400);
        }
        // Cursor carries an ordering boundary, not a database pointer; remains stable after deletion.
        boundary = { OR: [{ watchedDate: { lt: new Date(value.date) } }, { watchedDate: new Date(value.date), id: { lt: value.id } }] };
    }
    const [rows, logs, movies] = await db.$transaction([
        db.diaryEntry.findMany({ where: { AND: [where, boundary] }, include: { movie: true }, orderBy: [{ watchedDate: 'desc' }, { id: 'desc' }], take: 21 }),
        db.diaryEntry.count({ where }), db.diaryEntry.groupBy({ by: ['movieId'], where, orderBy: { movieId: 'asc' } }),
    ]);
    const entries = rows.slice(0, 20);
    const last = entries.at(-1);
    return { entries, nextCursor: rows.length > 20 && last ? Buffer.from(JSON.stringify({ id: last.id, date: last.watchedDate.toISOString() })).toString('base64url') : null, statistics: { logs, movies: movies.length } };
}

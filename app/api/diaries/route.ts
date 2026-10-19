import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { diaryEntrySchema } from '@/app/lib/diary/contracts';
import { json, diaryError, readDiaryBody } from '@/app/lib/diary/http';
import { createDiaryEntry, listDiaryEntries, parseDiaryFilters, serializeEntry } from '@/app/services/diaryEntryService';
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return json({ error: 'Unauthorized' }, 401);
    try {
        const input = diaryEntrySchema.parse(await readDiaryBody(request));
        const { entry, replayed } = await createDiaryEntry(session.user.id, input);
        return json(entry, replayed ? 200 : 201);
    }
    catch (error) {
        return diaryError(error);
    }
}
export async function GET(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return json({ error: 'Unauthorized' }, 401);
    try {
        const result = await listDiaryEntries(session.user.id, parseDiaryFilters(new URL(request.url).searchParams));
        return json({ ...result, entries: result.entries.map(serializeEntry) });
    }
    catch (error) {
        return diaryError(error);
    }
}

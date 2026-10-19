import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import prisma from '@/prisma/client';
import { diaryEntrySchema } from '@/app/lib/diary/contracts';
import { json, diaryError, readDiaryBody } from '@/app/lib/diary/http';
import { updateDiaryEntry, deleteDiaryEntry, serializeEntry } from '@/app/services/diaryEntryService';
type Context = {
    params: Promise<{
        id: string;
    }>;
};
export async function GET(_request: Request, { params }: Context) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return json({ error: 'Unauthorized' }, 401);
    try {
        const { id } = await params;
        const entry = await prisma.diaryEntry.findFirst({ where: { id, userId: session.user.id }, include: { movie: true } });
        return entry ? json(serializeEntry(entry)) : json({ error: 'Diary entry not found' }, 404);
    }
    catch (error) {
        return diaryError(error);
    }
}
export async function PATCH(request: Request, { params }: Context) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return json({ error: 'Unauthorized' }, 401);
    try {
        const { id } = await params;
        const existing = await prisma.diaryEntry.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
        if (!existing)
            return json({ error: 'Diary entry not found' }, 404);
        return json(await updateDiaryEntry(session.user.id, id, diaryEntrySchema.parse(await readDiaryBody(request))));
    }
    catch (error) {
        return diaryError(error);
    }
}
export async function DELETE(_request: Request, { params }: Context) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return json({ error: 'Unauthorized' }, 401);
    try {
        await deleteDiaryEntry(session.user.id, (await params).id);
        return json({ success: true });
    }
    catch (error) {
        return diaryError(error);
    }
}

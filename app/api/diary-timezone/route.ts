import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import prisma from '@/prisma/client';
import { isTimeZone } from '@/app/lib/diary/dates';
import { json } from '@/app/lib/movies/http';
export async function POST(request: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id)
        return json({ error: 'Unauthorized' }, 401);
    try {
        const input = await request.json();
        if (!input || typeof input.timeZone !== 'string' || !isTimeZone(input.timeZone) || Object.keys(input).length !== 1)
            return json({ error: 'Invalid timezone' }, 400);
        await prisma.user.updateMany({ where: { id: session.user.id, timeZone: null }, data: { timeZone: input.timeZone } });
        const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { timeZone: true } });
        return user ? json({ timeZone: user.timeZone ?? 'UTC' }) : json({ error: 'User not found' }, 404);
    }
    catch {
        return json({ error: 'Could not initialize timezone. Please retry.' }, 400);
    }
}

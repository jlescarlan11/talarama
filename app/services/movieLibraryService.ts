import 'server-only';
import prisma from '@/prisma/client';
import type { PrismaClient } from '@prisma/client';

export async function setLibraryEntry(userId: string, movieId: string, kind: 'favorite' | 'watchlist', present: boolean, { db = prisma }: { db?: PrismaClient } = {}) {
  const data = { movieId, userId };
  if (kind === 'favorite') {
    if (present) await db.likedBy.createMany({ data: [data], skipDuplicates: true });
    else await db.likedBy.deleteMany({ where: data });
  } else {
    if (present) await db.watchedList.createMany({ data: [data], skipDuplicates: true });
    else await db.watchedList.deleteMany({ where: data });
  }
}

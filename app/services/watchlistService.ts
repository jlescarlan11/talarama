import 'server-only';
import type { Prisma } from '@prisma/client';
export async function removeLoggedMovie(tx: Prisma.TransactionClient, userId: string, movieId: string) {
    await tx.watchlistEntry.deleteMany({ where: { userId, movieId } });
}

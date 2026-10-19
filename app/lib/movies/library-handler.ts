import 'server-only';
import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import prisma from '@/prisma/client';
import { setLibraryEntry } from '@/app/services/movieLibraryService';
import { json } from './http';

export type MovieContext = { params: Promise<{ id: string }> };
export async function libraryHandler(context: MovieContext, kind: 'favorite' | 'watchlist', present?: boolean) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return json({ error: 'Sign in to save movies.' }, 401);
  const { id: movieId } = await context.params;
  if (!movieId || movieId.length > 200) return json({ error: 'Invalid movie identity.' }, 400);
  try {
    if (!await prisma.movie.findUnique({ where: { id: movieId }, select: { id: true } })) return json({ error: 'Movie not found.' }, 404);
    const userId = session.user.id;
    let value = present;
    if (present === undefined) {
      const where = { movieId_userId: { movieId, userId } };
      value = !!(kind === 'favorite' ? await prisma.likedBy.findUnique({ where }) : await prisma.watchedList.findUnique({ where }));
    } else await setLibraryEntry(userId, movieId, kind, present);
    return json(kind === 'favorite' ? { liked: value } : { inWatchlist: value });
  } catch { return json({ error: 'Could not update your library. Please try again.' }, 503); }
}
export async function retiredCatalogWrite() {
  const session = await getServerSession(authOptions);
  return json({ error: session?.user?.id ? 'Manual catalog changes are retired. Discover a movie instead.' : 'Sign in required.' }, session?.user?.id ? 403 : 401);
}

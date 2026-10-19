import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { z } from 'zod';
import { tmdbIdSchema } from '@/app/lib/tmdb/normalize';
import { importMovie } from '@/app/services/movieImportService';
import { json, movieError } from '@/app/lib/movies/http';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return json({ error: 'Sign in to save movies.' }, 401);
  let body;
  try { body = z.object({ tmdbId: tmdbIdSchema }).strict().parse(await request.json()); }
  catch { return json({ error: 'Invalid movie identity.' }, 400); }
  try { return json({ movieId: (await importMovie(body.tmdbId)).id }); }
  catch (error) { return movieError(error); }
}

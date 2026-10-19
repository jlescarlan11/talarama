import 'server-only';
import { TmdbError } from '@/app/lib/tmdb/client';

export function json(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } });
}
export function movieError(error: unknown) {
  if (error instanceof TmdbError) {
    if (error.code === 'INVALID_INPUT') return json({ error: 'Invalid movie request.' }, 400);
    if (['NOT_FOUND', 'CONTENT_BLOCKED'].includes(error.code)) return json({ error: 'Movie not found.' }, 404);
  }
  return json({ error: 'Movie provider is unavailable. Please try again.' }, 503);
}

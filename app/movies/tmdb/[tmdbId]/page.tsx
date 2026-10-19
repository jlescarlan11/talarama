import { notFound } from 'next/navigation';
import DetailPage from '../../_components/DetailPage';
import { tmdbIdSchema } from '@/app/lib/tmdb/normalize';

export default async function TmdbMoviePage({ params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId } = await params;
  const parsed = /^\d+$/.test(tmdbId) ? tmdbIdSchema.safeParse(Number(tmdbId)) : null;
  if (!parsed?.success) notFound();
  return <DetailPage identity={{ tmdbId: parsed.data }} />;
}

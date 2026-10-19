import { getServerSession } from 'next-auth';
import authOptions from '@/app/auth/authOptions';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getMovieDetail } from '@/app/services/movieDetailService';
import MovieDetail from './MovieDetail';
import MovieReviews from '../[id]/MovieReviews';
import RetryDetails from './RetryDetails';

export default async function DetailPage({ identity }: { identity: { localId: string } | { tmdbId: number } }) {
  const session = await getServerSession(authOptions);
  let detail;
  try { detail = await getMovieDetail(identity, session?.user?.id); }
  catch { return <section role="alert" className="max-w-[36rem] mx-auto py-12 space-y-5"><h1 className="text-3xl font-bold">Movie information is unavailable</h1><p>The provider could not load this movie. Please try again. Saved movies remain in your library.</p><RetryDetails /><Link className="btn btn-outline" href="/movies">Discover movies</Link></section>; }
  if (!detail) notFound();
  return <div className="pb-12"><MovieDetail {...detail} signedIn={!!session?.user?.id} /><div className="max-w-6xl mx-auto"><MovieReviews reviews={detail.reviews} /></div></div>;
}

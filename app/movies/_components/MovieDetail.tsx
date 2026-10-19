import Link from 'next/link';
import type { CatalogMovie, LocalCatalogMovie } from '@/app/lib/tmdb/types';
import LibraryActions from './LibraryActions';
import MovieArtwork from './MovieArtwork';
import RetryDetails from './RetryDetails';

interface Props { movie: CatalogMovie | LocalCatalogMovie; localId: string | null; signedIn: boolean; favorite: boolean; watchlist: boolean; rating: { average: number | null; count: number }; providerUnavailable?: boolean }
export default function MovieDetail({ movie, localId, signedIn, favorite, watchlist, rating, providerUnavailable }: Props) {
  return <article className="max-w-6xl mx-auto space-y-8">
    <Link href="/movies" className="link inline-block">← Discover movies</Link>
    {providerUnavailable && <div role="status" className="p-4 rounded-lg border border-base-300 bg-base-200 space-y-3"><p>Live movie information is unavailable. Showing the saved local snapshot. Your library actions still work.</p><RetryDetails /></div>}
    <section className="relative overflow-hidden rounded-2xl border border-base-300 bg-base-200">
      {movie.backdropUrl && <div className="absolute inset-0 opacity-15" aria-hidden="true"><MovieArtwork src={movie.backdropUrl} title={movie.title} backdrop /></div>}
      <div className="relative grid md:grid-cols-[240px_1fr] gap-6 md:gap-10 p-5 md:p-10">
        <div className="relative aspect-[2/3] w-40 sm:w-52 md:w-full overflow-hidden rounded-lg shadow-lg"><MovieArtwork src={movie.posterUrl} title={movie.title} /></div>
        <div className="space-y-5 min-w-0"><div className="space-y-3"><p className="text-primary font-semibold text-sm uppercase tracking-widest">Movie journal</p><h1 className="text-3xl md:text-5xl font-bold break-words">{movie.title}</h1><div className="flex flex-wrap gap-x-4 gap-y-1 text-base-content/70"><span>{movie.releasedYear ?? 'Release year unknown'}</span><span>{movie.duration ? `${movie.duration} min` : 'Runtime unknown'}</span></div></div>
          <p className="max-w-2xl leading-relaxed whitespace-pre-line break-words">{movie.description || 'No synopsis available.'}</p>
          <div className="flex flex-wrap gap-2">{movie.genres.length ? movie.genres.map((genre, index) => <span key={`${genre.name}-${index}`} className="badge badge-outline h-auto py-1">{genre.name}</span>) : <p className="text-sm text-base-content/70">Genres unavailable</p>}</div>
          <div className="grid sm:grid-cols-2 gap-4 py-4 border-y border-base-300">
            <div><p className="font-semibold">{movie.tmdbScore === null ? 'TMDB: not rated' : `TMDB ${movie.tmdbScore.toFixed(1)}/10`}</p><p className="text-sm text-base-content/70">{movie.tmdbVoteCount === null ? 'Saved provider score · vote count unavailable' : `${movie.tmdbVoteCount} TMDB vote${movie.tmdbVoteCount === 1 ? '' : 's'}`}</p></div>
            <div><p className="font-semibold">{rating.average === null ? 'Talarama: no ratings yet' : `Talarama ${rating.average.toFixed(1)}/5`}</p><p className="text-sm text-base-content/70">{rating.count} rating{rating.count === 1 ? '' : 's'}{rating.count > 0 && rating.count < 5 ? ' · early ratings' : ''}</p><p className="text-xs text-base-content/60">Based on diary ratings</p></div>
          </div>
          <LibraryActions key={localId ?? movie.tmdbId} localId={localId} tmdbId={movie.tmdbId} title={movie.title} posterUrl={movie.posterUrl} signedIn={signedIn} favorite={favorite} watchlist={watchlist} />
        </div>
      </div>
    </section>
    <section className="grid md:grid-cols-2 gap-8"><div className="space-y-3"><h2 className="text-xl font-bold">Directed by</h2><p>{movie.directors.length ? movie.directors.map(person => person.name).join(', ') : 'Director unavailable'}</p></div><div className="space-y-3"><h2 className="text-xl font-bold">Cast</h2>{movie.cast.length ? <ul className="grid sm:grid-cols-2 gap-3">{movie.cast.map((person, index) => <li key={`${person.tmdbId}-${index}`}><p className="font-medium">{person.name}</p><p className="text-sm text-base-content/70">{person.character || 'Role unavailable'}</p></li>)}</ul> : <p>Cast unavailable</p>}</div></section>
  </article>;
}

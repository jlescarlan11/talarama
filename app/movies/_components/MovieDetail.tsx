import Link from 'next/link';
import type { DiscoveredMovie, LocalCatalogMovie } from '@/app/lib/tmdb/types';
import { scoreLabel } from '@/app/lib/movies/score-label';
import LibraryActions from './LibraryActions';
import MovieArtwork from './MovieArtwork';
import RetryDetails from './RetryDetails';

interface Props { movie: DiscoveredMovie | LocalCatalogMovie; localId: string | null; signedIn: boolean; favorite: boolean; watchlist: boolean; rating: { average: number | null; count: number }; providerUnavailable?: boolean }
export default function MovieDetail({ movie, localId, signedIn, favorite, watchlist, providerUnavailable }: Props) {
  return <article className="max-w-6xl mx-auto space-y-8">
    <nav aria-label="Breadcrumb" className="text-sm breadcrumbs"><ul><li><Link href="/">Home</Link></li><li><Link href="/movies">Movies</Link></li><li className="break-words">{movie.title}</li></ul></nav>
    {providerUnavailable && <div role="status" className="p-4 rounded-lg border border-base-300 bg-base-200 space-y-3"><p>Live movie information is unavailable. Showing the saved local snapshot. Your library actions still work.</p><RetryDetails /></div>}
    <section className="bg-base-100">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 px-0 sm:px-4 py-8">
        <div className="w-full max-w-80 lg:w-80 flex-shrink-0 space-y-2">
          <div className="relative aspect-[2/3] w-full overflow-hidden rounded-lg shadow-2xl bg-base-300"><MovieArtwork src={movie.posterUrl} title={movie.title} /></div>
          {movie.posterCredit && <p className="text-xs text-base-content/70 break-words"><a className="link" href={movie.posterCredit.sourceUrl}>Poster source: Wikimedia Commons</a><br />{movie.posterCredit.artist} | <a className="link" href={movie.posterCredit.licenseUrl}>{movie.posterCredit.license}</a>{movie.posterCredit.credit && <> | {movie.posterCredit.credit}</>}</p>}
        </div>
        <div className="space-y-6 min-w-0 flex-1"><div className="space-y-3"><h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold break-words leading-tight">{movie.title}</h1><div className="flex flex-wrap gap-x-4 gap-y-1 text-base-content/70"><span>{movie.releasedYear ?? 'Release year unknown'}</span><span>{movie.duration ? `${movie.duration} min` : 'Runtime unknown'}</span></div></div>
          <p className="max-w-2xl leading-relaxed whitespace-pre-line break-words">{movie.description || 'No synopsis available.'}</p>
          <div className="flex flex-wrap gap-2">{movie.genres.length ? movie.genres.map((genre, index) => <span key={`${genre.name}-${index}`} className="px-3 py-1 bg-primary/80 text-primary-content rounded-full text-sm">{genre.name}</span>) : <p className="text-sm text-base-content/70">Genres unavailable</p>}</div>
          <div className="grid sm:grid-cols-2 gap-4 py-4 border-y border-base-300">
            <div><p className="font-semibold">{scoreLabel(movie)}</p><p className="text-sm text-base-content/70">{'wikidataId' in movie ? 'CC0 movie metadata · no provider rating' : movie.tmdbVoteCount === null ? 'Saved provider score · vote count unavailable' : `${movie.tmdbVoteCount} TMDB vote${movie.tmdbVoteCount === 1 ? '' : 's'}`}</p>{'wikidataId' in movie && <a className="link text-sm" href={`https://www.wikidata.org/wiki/${movie.wikidataId}`}>View source on Wikidata</a>}</div>
            <p className="text-sm text-base-content/70">Your diary ratings stay in your personal library.</p>
          </div>
          <LibraryActions key={localId ?? ('wikidataId' in movie?movie.wikidataId:movie.tmdbId)} localId={localId} tmdbId={movie.tmdbId} wikidataId={'wikidataId' in movie?movie.wikidataId:undefined} title={movie.title} posterUrl={movie.posterUrl} signedIn={signedIn} favorite={favorite} watchlist={watchlist} />
        </div>
      </div>
    </section>
    <section className="grid md:grid-cols-2 gap-8"><div className="space-y-3"><h2 className="text-xl font-bold">Directed by</h2><p>{movie.directors.length ? movie.directors.map(person => person.name).join(', ') : 'Director unavailable'}</p></div><div className="space-y-3"><h2 className="text-xl font-bold">Cast</h2>{movie.cast.length ? <ul className="grid sm:grid-cols-2 gap-3">{movie.cast.map((person, index) => <li key={`${'wikidataId' in person?person.wikidataId:person.tmdbId}-${index}`}><p className="font-medium">{person.name}</p><p className="text-sm text-base-content/70">{person.character || 'Role unavailable'}</p></li>)}</ul> : <p>Cast unavailable</p>}</div></section>
  </article>;
}

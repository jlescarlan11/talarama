'use client';
import Image from 'next/image';
import Link from 'next/link';
import { movieHref } from '@/app/lib/movies/links';
import type { CatalogMovie, LocalCatalogMovie } from '@/app/lib/tmdb/types';

export default function CatalogCard({ movie }: { movie: CatalogMovie | LocalCatalogMovie }) {
  return <Link href={movieHref(movie)} className="group block min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
    <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-base-200 border border-base-300">
      <Image src={movie.posterUrl || '/placeholder-movie.svg'} alt={`Poster for ${movie.title}`} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 23vw, 180px" className="object-cover" onError={event => { event.currentTarget.srcset = ''; event.currentTarget.src = '/placeholder-movie.svg'; }} />
    </div>
    <h3 className="mt-3 font-semibold leading-snug group-hover:text-primary break-words">{movie.title}</h3>
    <p className="text-sm text-base-content/70 mt-1">{movie.releasedYear ?? 'Release year unknown'}</p>
    <p className="text-xs text-base-content/70 mt-1">{movie.tmdbScore === null ? 'TMDB: not rated' : `TMDB ${movie.tmdbScore.toFixed(1)}/10`}</p>
  </Link>;
}

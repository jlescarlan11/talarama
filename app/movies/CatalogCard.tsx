'use client';
import {isCommonsPosterUrl} from '@/app/lib/movies/poster-credit';
import Image from 'next/image';
import Link from 'next/link';
import { movieHref } from '@/app/lib/movies/links';
import type { DiscoveredMovie, LocalCatalogMovie } from '@/app/lib/tmdb/types';
import { scoreLabel } from '@/app/lib/movies/score-label';

export default function CatalogCard({ movie }: { movie: DiscoveredMovie | LocalCatalogMovie }) {
  return <Link href={movieHref(movie)} className="group block min-w-0 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary">
    <div className="relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-base-200">
      <Image unoptimized={isCommonsPosterUrl(movie.posterUrl)} referrerPolicy="no-referrer" src={movie.posterUrl || '/placeholder-movie.svg'} alt={`Poster for ${movie.title}`} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 23vw, 180px" className="object-cover transition-transform duration-700 group-hover:scale-110" onError={event => { event.currentTarget.srcset = ''; event.currentTarget.src = '/placeholder-movie.svg'; }} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 inset-x-0 p-3 text-white text-center space-y-1">
        <h3 className="text-sm font-semibold leading-tight break-words">{movie.title}</h3>
        <p className="text-xs text-white/80">{movie.releasedYear ?? 'Release year unknown'}</p>
        <p className="text-xs text-white/80">{scoreLabel(movie)}</p>
      </div>
    </div>
  </Link>;
}

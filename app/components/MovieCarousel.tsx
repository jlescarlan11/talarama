"use client";
import {isCommonsPosterUrl} from '@/app/lib/movies/poster-credit';
import EmptyState from "./EmptyState";
import React, { useRef, useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { movieHref } from "@/app/lib/movies/links";
import Image from "next/image";
import Link from "next/link";
import { Movie, MovieCategorizesAs, Genre } from "@prisma/client";
import type { DiscoveredMovie } from "@/app/lib/tmdb/types";
import { scoreLabel } from '@/app/lib/movies/score-label';

type MovieWithGenres = Movie & {
  genres: (MovieCategorizesAs & {
    genre: Genre;
  })[];
  _count?: {
    diaryEntries?: number;
  };
};

interface MovieCarouselProps {
  movies: (MovieWithGenres | DiscoveredMovie)[];
}

interface CardStyle {
  scale: number;
  opacity: number;
  zIndex: number;
}

const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeToMotion = (notify: () => void) => {
  const query = window.matchMedia?.(motionQuery);
  query?.addEventListener("change", notify);
  return () => query?.removeEventListener("change", notify);
};
const getMotionPreference = () => window.matchMedia?.(motionQuery).matches ?? true;
const getServerMotionPreference = () => true;

const MovieCarousel: React.FC<MovieCarouselProps> = ({ movies }) => {
  const displayMovies = movies.slice(0, 14);
  const [activeIdx, setActiveIdx] = useState(
    Math.floor(displayMovies.length / 2)
  );
  const trackRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const reducedMotion = useSyncExternalStore(subscribeToMotion, getMotionPreference, getServerMotionPreference);

  const getCardStyle = useCallback((offset: number): CardStyle => {
    if (offset === 0) return { scale: 1.1, opacity: 1, zIndex: 20 };
    if (Math.abs(offset) === 1)
      return { scale: 0.95, opacity: 0.8, zIndex: 15 };
    return { scale: 0.9, opacity: 0.5, zIndex: 10 };
  }, []);

  const scrollToActiveCard = useCallback(() => {
    if (!trackRef.current) return;

    const children = Array.from(trackRef.current.children);
    const activeCard = children[activeIdx] as HTMLElement;
    if (!activeCard) return;

    const track = trackRef.current;
    const trackRect = track.getBoundingClientRect();
    const cardRect = activeCard.getBoundingClientRect();
    const offset =
      cardRect.left -
      trackRect.left -
      (trackRect.width / 2 - cardRect.width / 2);

    track.scrollTo({ left: track.scrollLeft + offset, behavior: reducedMotion ? "auto" : "smooth" });
  }, [activeIdx, reducedMotion]);

  useEffect(() => {
    if (isHovered || hasFocus || reducedMotion || displayMovies.length < 2) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % displayMovies.length);
    }, 2000);

    return () => {
      clearInterval(interval);
    };
  }, [displayMovies.length, isHovered, hasFocus, reducedMotion]);

  useEffect(() => {
    scrollToActiveCard();
  }, [activeIdx, scrollToActiveCard]);

  const lastIndex = Math.max(0, displayMovies.length - 1);
  if (activeIdx > lastIndex) setActiveIdx(lastIndex);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setActiveIdx(
        (prev) => (prev - 1 + displayMovies.length) % displayMovies.length
      );
    } else if (e.key === "ArrowRight") {
      setActiveIdx((prev) => (prev + 1) % displayMovies.length);
    }
  };

  if (!displayMovies.length) return <EmptyState title="No movies yet" description="Movies will appear here once the catalog has entries." href="/movies" action="Browse movies" />;

  return (
    <div
      className="movie-carousel-outer flex flex-col items-center"
      role="region"
      aria-label="Movie carousel"
      onKeyDown={handleKeyDown}
      onFocus={() => setHasFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        ref={trackRef}
        className="movie-carousel-track flex gap-6 overflow-x-auto scrollbar-hide px-4 py-8 snap-x snap-mandatory"
        style={{ scrollBehavior: reducedMotion ? "auto" : "smooth" }}
        role="list"
      >
        {[...Array(5)].map((_, i) => {
          const offset = i - 2;
          const idx =
            (activeIdx + offset + displayMovies.length) % displayMovies.length;
          const movie = displayMovies[idx];
          const genreNames = movie.genres.map(item => 'genre' in item ? item.genre.genreName : item.name);
          const { scale, opacity, zIndex } = getCardStyle(offset);

          return (
            <Link
              href={movieHref(movie)}
              key={`${movieHref(movie)}-${offset}`}
              className="flex-none w-56 h-80"
              role="listitem"
              aria-label={`${movie.title} (${movie.releasedYear ?? 'Release year unknown'})`}
            >
              <div
                className={`w-full h-full bg-base-100 rounded-2xl overflow-hidden shadow-lg relative snap-center transition-all duration-300 group`}
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  zIndex,
                  pointerEvents: "auto",
                }}
              >
                {movie.posterUrl ? (
                  <Image
                    src={movie.posterUrl}
                    unoptimized={isCommonsPosterUrl(movie.posterUrl)}
                    referrerPolicy="no-referrer"
                    alt={`Poster for ${movie.title}`}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={event => { event.currentTarget.srcset = ''; event.currentTarget.src = '/placeholder-movie.svg'; }}
                    priority={offset === 0}
                    loading={offset === 0 ? "eager" : "lazy"}
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold"
                    role="img"
                    aria-label="No poster available"
                  >
                    No Image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <div className="text-center space-y-2">
                    <h3 className="text-sm font-semibold leading-tight line-clamp-2">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-white/80 font-medium">
                      {movie.releasedYear}
                    </p>
                    <p className="text-xs text-white/90">{scoreLabel(movie)}</p>
                    {genreNames.length > 0 && (
                      <div
                        className="flex flex-wrap gap-1 justify-center mt-2"
                        role="list"
                        aria-label="Movie genres"
                      >
                        {genreNames.slice(0, 2).map((name, index) => (
                          <span
                            key={`${name}-${index}`}
                            className="text-xs bg-white/25 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20"
                            role="listitem"
                          >
                            {name}
                          </span>
                        ))}
                        {genreNames.length > 2 && (
                          <span
                            className="text-xs text-white/70 bg-white/15 backdrop-blur-sm px-2 py-1 rounded-full"
                            aria-label={`${
                              genreNames.length - 2
                            } more genres`}
                          >
                            +{genreNames.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white bg-gradient-to-t from-black/90 to-transparent group-hover:opacity-0 group-focus-visible:opacity-100 transition-opacity duration-300">
                  <div className="text-center">
                    <h3 className="text-xs font-medium leading-tight line-clamp-1 drop-shadow-lg">
                      {movie.title}
                    </h3>
                    <p className="text-xs text-white/90 mt-1">{movie.releasedYear ?? 'Release year unknown'}</p>
                    <p className="text-xs text-white/90 mt-1">{scoreLabel(movie)}</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <div
        className="flex gap-2 mt-4"
        role="tablist"
        aria-label="Carousel navigation"
      >
        {displayMovies.map((_, idx) => (
          <button
            key={idx}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              idx === activeIdx ? "bg-primary" : "bg-primary/20 opacity-50"
            }`}
            role="tab"
            aria-selected={idx === activeIdx}
            aria-label={`Go to slide ${idx + 1}`}
            onClick={() => setActiveIdx(idx)}
          />
        ))}
      </div>
    </div>
  );
};

export default MovieCarousel;

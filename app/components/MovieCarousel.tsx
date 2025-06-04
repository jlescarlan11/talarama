'use client';
import React, { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MovieWithGenres } from '../types/movie';

interface MovieCarouselProps {
  movies: MovieWithGenres[];
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({ movies }) => {
  // Show up to 14 unique posters for a longer loop
  const displayMovies = movies.slice(0, 14);
  const [activeIdx, setActiveIdx] = useState(Math.floor(displayMovies.length / 2));
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Auto-advance logic
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % displayMovies.length);
    }, 2000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [displayMovies.length]);

  // Scroll to active card
  useEffect(() => {
    if (trackRef.current) {
      const children = Array.from(trackRef.current.children);
      const activeCard = children[activeIdx] as HTMLElement;
      if (activeCard) {
        const track = trackRef.current;
        const trackRect = track.getBoundingClientRect();
        const cardRect = activeCard.getBoundingClientRect();
        const offset = cardRect.left - trackRect.left - (trackRect.width / 2 - cardRect.width / 2);
        track.scrollTo({ left: track.scrollLeft + offset, behavior: 'smooth' });
      }
    }
  }, [activeIdx, displayMovies.length]);

  return (
    <div className="movie-carousel-outer flex flex-col items-center">
      <div
        ref={trackRef}
        className="movie-carousel-track flex gap-6 overflow-x-auto scrollbar-hide px-4 py-8 snap-x snap-mandatory"
        style={{ scrollBehavior: 'smooth' }}
      >
        {[...Array(5)].map((_, i) => {
          // Calculate the wrapped index for each of the 5 visible cards
          const offset = i - 2; // -2, -1, 0, 1, 2
          const idx = (activeIdx + offset + displayMovies.length) % displayMovies.length;
          const movie = displayMovies[idx];
          // Calculate scale and opacity for side cards
          let scale = 1, opacity = 1, zIndex = 10;
          if (offset === 0) {
            scale = 1.1;
            opacity = 1;
            zIndex = 20;
          } else if (Math.abs(offset) === 1) {
            scale = 0.95;
            opacity = 0.8;
            zIndex = 15;
          } else if (Math.abs(offset) === 2) {
            scale = 0.9;
            opacity = 0.5;
            zIndex = 10;
          }
          return (
            <Link
              href={`/movies/${movie.id}`}
              key={movie.id + '-' + offset}
              className="flex-none w-56 h-80"
            >
              <div
                className={`w-full h-full bg-gray-300 rounded-2xl overflow-hidden shadow-lg relative snap-center transition-transform duration-300`}
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  zIndex,
                  pointerEvents: 'auto'
                }}
              >
                {movie.posterUrl ? (
                  <Image
                    src={movie.posterUrl}
                    alt={movie.title}
                    fill
                    className="object-cover"
                    sizes="224px"
                    priority={offset === 0}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                    No Image
                  </div>
                )}
                {/* Overlay for genre and title */}
                <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col items-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <span className="text-white text-base font-semibold mb-1 drop-shadow">
                    {movie.genres[0]?.genre.genreName || 'Unknown Genre'}
                  </span>
                  <span className="text-white text-lg font-bold drop-shadow text-center">
                    {movie.title}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {/* Pagination dots */}
      <div className="flex gap-2 mt-4">
        {displayMovies.map((_, idx) => (
          <span
            key={idx}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              idx === activeIdx ? 'bg-violet-500' : 'bg-gray-400 opacity-50'
            }`}
            style={{ display: 'inline-block' }}
          />
        ))}
      </div>
    </div>
  );
};

export default MovieCarousel;

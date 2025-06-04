'use client';
import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { MovieWithGenres } from '../types/movie';

interface MovieCarouselProps {
  movies: MovieWithGenres[];
}

const MovieCarousel: React.FC<MovieCarouselProps> = ({ movies }) => {
  // Show up to 14 unique posters for a longer loop
  const displayMovies = movies.slice(0, 14);
  const posters = [...displayMovies, ...displayMovies]; // duplicate for looping
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (trackRef.current) {
      // Get the width of half the posters (the first set)
      const children = Array.from(trackRef.current.children).slice(0, displayMovies.length);
      const halfWidth = children.reduce((acc, el) => acc + (el as HTMLElement).offsetWidth + 16, 0); // 16px gap
      trackRef.current.style.setProperty('--carousel-half-width', `${halfWidth}px`);
      trackRef.current.style.setProperty('--carousel-track-width', `${halfWidth * 2}px`);
    }
  }, [displayMovies.length]);

  return (
    <div className="movie-carousel-outer">
      <div ref={trackRef} className="movie-carousel-track">
        {posters.map((movie, idx) => (
          <div
            key={movie.id + '-' + idx}
            className="flex-none w-32 h-44 bg-gray-300 rounded-xl overflow-hidden shadow-lg relative transition-transform duration-200 hover:scale-105 hover:shadow-2xl"
          >
            {movie.posterUrl ? (
              <Image
                src={movie.posterUrl}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="128px"
                priority={idx === Math.floor(displayMovies.length / 2)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl font-bold">
                No Image
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MovieCarousel;

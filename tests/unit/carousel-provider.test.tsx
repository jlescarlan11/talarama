import { fireEvent, render, screen } from '@testing-library/react';
import { beforeAll, expect, it, vi } from 'vitest';
import MovieCarousel from '@/app/components/MovieCarousel';
import type { CatalogMovie } from '@/app/lib/tmdb/types';

const movie: CatalogMovie = { localId: null, tmdbId: 42, title: 'Provider film', description: null, releasedYear: 2020, duration: 90, posterUrl: '/missing-sample.png', backdropUrl: null, genres: [{ tmdbId: 18, name: 'Drama' }], cast: [], directors: [], tmdbScore: 8.2, tmdbVoteCount: 12 };
beforeAll(() => { HTMLElement.prototype.scrollTo = vi.fn(); });
it('keeps provider score and year in the carousel without requiring hover', () => {
  render(<MovieCarousel movies={[movie]} />);
  expect(screen.getAllByText('TMDB 8.2/10')).toHaveLength(10);
  for (const score of screen.getAllByText('TMDB 8.2/10')) expect(score).toBeVisible();
  expect(screen.getAllByRole('listitem', { name: 'Provider film (2020)' })[0]).toHaveAttribute('href', '/movies/tmdb/42');
});
it('replaces broken provider artwork with the safe local fallback', () => {
  render(<MovieCarousel movies={[movie]} />);
  const poster = screen.getAllByRole('img', { name: 'Poster for Provider film' })[0];
  fireEvent.error(poster);
  expect(poster).toHaveAttribute('src', '/placeholder-movie.svg');
});

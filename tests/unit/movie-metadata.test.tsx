import { render, screen, renderHook, act } from '@testing-library/react';
import { it, expect } from 'vitest';
import MovieInfo from '@/app/movies/[id]/MovieInfo';
import type { MovieWithGenres } from '@/app/movies/[id]/types';
import { useMovieSearch } from '@/app/hooks/useMovieSearch';
it('renders missing local year and runtime without crashing or fabricating zeroes', () => {
  const movie: MovieWithGenres = { id: 'unknown', title: 'Unknown metadata', createdAt: new Date('2020-01-01'), releasedYear: null, duration: null, genres: [] };
  render(<MovieInfo movie={movie} />);
  expect(screen.getAllByText('Unknown').length).toBe(3);
  expect(screen.queryByText('0h 0m')).not.toBeInTheDocument();
});
it('searches local snapshots with unknown release year without throwing', () => {
  const films = [{ id: 'legacy', title: 'Legacy', releasedYear: null, duration: null }];
  const { result } = renderHook(() => useMovieSearch(films));
  act(() => result.current.handleSearch('2020'));
  expect(result.current.filteredMovies).toEqual([]);
  act(() => result.current.handleSearch('Legacy'));
  expect(result.current.filteredMovies[0].id).toBe('legacy');
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import MovieDetail from '@/app/movies/_components/MovieDetail';
import LibraryActions from '@/app/movies/_components/LibraryActions';
import RetryDetails from '@/app/movies/_components/RetryDetails';
import type { CatalogMovie } from '@/app/lib/tmdb/types';
const routing = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => routing }));
vi.mock('next/image', () => ({ default: (props: { src: string; alt: string }) => <span role="img" aria-label={props.alt} /> }));
const movie: CatalogMovie = { localId: null, tmdbId: 42, title: 'Unknown film', description: null, releasedYear: null, duration: null, posterUrl: null, backdropUrl: null, genres: [], cast: [], directors: [], tmdbScore: null, tmdbVoteCount: 0 };
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });
it('retries failed detail rendering by requesting a fresh server render', () => {
  render(<RetryDetails />);
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(routing.refresh).toHaveBeenCalledOnce();
});
it('renders honest missing metadata and separate provider/local score scales', () => {
  const view = render(<MovieDetail movie={movie} localId={null} signedIn={false} favorite={false} watchlist={false} rating={{ average: null, count: 0 }} />);
  expect(screen.getByText('Release year unknown')).toBeVisible();
  expect(screen.getByText('Runtime unknown')).toBeVisible();
  expect(screen.getByText('No synopsis available.')).toBeVisible();
  expect(screen.getByText('TMDB: not rated')).toBeVisible();
  expect(screen.getByText('Your diary ratings stay in your personal library.')).toBeVisible();
  expect(screen.getByRole('link', { name: 'Sign in to save or log' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Sign in to save or log' })).toHaveAttribute('href', '/api/auth/signin?callbackUrl=%2Fmovies%2Ftmdb%2F42');
  view.rerender(<MovieDetail movie={{ ...movie, tmdbScore: 8, tmdbVoteCount: 1 }} localId="local" signedIn={false} favorite={false} watchlist={false} rating={{ average: 4, count: 1 }} />);
  expect(screen.getByText('TMDB 8.0/10')).toBeVisible();
  expect(screen.queryByText('Talarama 4.0/5')).not.toBeInTheDocument();
  expect(screen.queryByText('1 rating · early ratings')).not.toBeInTheDocument();
});
it('imports before saving and retries the same add intent after a lost response', async () => {
  const calls: [string, string | undefined][] = [];
  let failed = false;
  vi.stubGlobal('fetch', vi.fn(async (url: string, options: RequestInit) => {
    calls.push([url, options.method]);
    if (url.endsWith('/import')) return Response.json({ movieId: 'local-42' });
    if (!failed) { failed = true; throw new Error('Response lost after server commit'); }
    return Response.json({ liked: options.method !== 'DELETE' });
  }));
  render(<LibraryActions localId={null} tmdbId={42} title="Film" posterUrl={null} signedIn favorite={false} watchlist={false} />);
  fireEvent.click(screen.getByRole('button', { name: 'Like movie' }));
  await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button', { name: 'Like movie' }));
  await screen.findByRole('button', { name: 'Unlike movie' });
  expect(calls).toEqual([['/api/movies/import', 'POST'], ['/api/movies/local-42/like', 'POST'], ['/api/movies/local-42/like', 'POST']]);
  fireEvent.click(screen.getByRole('button', { name: 'Unlike movie' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Like movie' })).toHaveAttribute('aria-pressed', 'false'));
  expect(calls.at(-1)).toEqual(['/api/movies/local-42/like', 'DELETE']);
});

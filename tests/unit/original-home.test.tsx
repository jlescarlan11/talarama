import { render, screen } from '@testing-library/react';
import { beforeEach, expect, it, vi } from 'vitest';
import Home from '@/app/page';
const source = vi.hoisted(() => ({ discover: vi.fn(), local: vi.fn(), session: vi.fn() }));
vi.mock('@/app/lib/tmdb/server', () => ({ tmdb: { discover: source.discover } }));
vi.mock('@/app/services/movieService', () => ({ MovieService: { getFeaturedMovies: source.local } }));
vi.mock('next-auth', () => ({ getServerSession: source.session }));
vi.mock('@/app/auth/authOptions', () => ({ default: {} }));
vi.mock('@/app/components/MovieCarousel', () => ({ default: ({ movies }: { movies: { title: string }[] }) => <div aria-label="Movie carousel">{movies.map(movie => <span key={movie.title}>{movie.title}</span>)}</div> }));
beforeEach(() => { vi.clearAllMocks(); source.session.mockResolvedValue(null); source.discover.mockResolvedValue({ results: [{ title: 'Fresh provider movie' }] }); });
it('restores the welcome and carousel while sourcing fresh discovery without a local catalog read', async () => {
  render(await Home());
  expect(screen.getByRole('heading', { name: 'Welcome to Movie Diary' })).toBeVisible();
  expect(screen.getByText("Here's where you left off your movie roll....")).toBeVisible();
  expect(screen.getByLabelText('Movie carousel')).toHaveTextContent('Fresh provider movie');
  expect(source.local).not.toHaveBeenCalled();
  expect(screen.getByRole('link', { name: 'Discover movies' })).toHaveAttribute('href', '/movies');
});
it('keeps the personal greeting and an honest local fallback on provider failure', async () => {
  source.session.mockResolvedValue({ user: { username: 'original_member' } });
  source.discover.mockRejectedValue(new Error('Provider unavailable'));
  source.local.mockResolvedValue([{ title: 'Preserved local movie' }]);
  render(await Home());
  expect(screen.getByRole('heading', { name: 'Welcome back, original_member' })).toBeVisible();
  expect(screen.getByLabelText('Movie carousel')).toHaveTextContent('Preserved local movie');
  expect(screen.getByRole('status')).toHaveTextContent('saved local movies');
});

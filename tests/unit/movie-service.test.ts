import { describe, it, expect, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { MovieService } from '@/app/services/movieService';
const db = vi.hoisted(() => ({ movie: { findMany: vi.fn().mockResolvedValue([]) }, $disconnect: vi.fn() }));
vi.mock('@/prisma/client', () => ({ default: db }));
describe('shared Prisma lifecycle', () => {
  it('keeps the connection available after movie requests', async () => {
    await MovieService.getMovies({});
    await MovieService.getFeaturedMovies();
    expect(db.$disconnect).not.toHaveBeenCalled();
  });
});

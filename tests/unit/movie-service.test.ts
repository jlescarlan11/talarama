import { describe, it, expect, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { MovieService } from '@/app/services/movieService';
import {scoreLabel} from '@/app/lib/movies/score-label';
const db = vi.hoisted(() => ({ movie: { findMany: vi.fn().mockResolvedValue([]) }, externalMovieIdentity: {findMany:vi.fn().mockResolvedValue([])}, $disconnect: vi.fn() }));
vi.mock('@/prisma/client', () => ({ default: db }));
describe('shared Prisma lifecycle', () => {
  it('keeps the connection available after movie requests', async () => {
    await MovieService.getMovies({});
    await MovieService.getFeaturedMovies();
    expect(db.$disconnect).not.toHaveBeenCalled();
  });
});
it('retains Wikidata provenance in the saved homepage outage fallback',async()=>{
 vi.stubEnv('NEXTAUTH_URL','http://127.0.0.1:3000');vi.stubEnv('CATALOG_PROVIDER','wikidata');vi.stubEnv('TALARAMA_MOVIE_SYNC','1');
 try{
 db.movie.findMany.mockResolvedValueOnce([{id:'unchanged-local',title:'Saved film',tmdbScore:null,genres:[],externalIdentities:[{provider:'WIKIDATA',externalId:'Q25188'}]}]);
 const [movie]=await MovieService.getFeaturedMovies();
 expect(scoreLabel(movie)).toBe('Wikidata');
 }finally{vi.unstubAllEnvs();}
});

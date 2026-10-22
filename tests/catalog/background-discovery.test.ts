// @vitest-environment node
import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const fixture=vi.hoisted(()=>({
 load:vi.fn(async(page:number)=>({page,totalPages:page+1,hasMore:true,results:[]})),
 read:vi.fn(async()=>[]),detail:vi.fn(async()=>{throw Error('Unseen films must not enter the detail queue');}),
}));
vi.mock('@/prisma/client',()=>({default:{externalMovieIdentity:{findMany:fixture.read}}}));
vi.mock('@/app/lib/wikidata/server',async()=>{
 const {DiscoveryPrefetch}=await import('@/app/lib/wikidata/discovery-prefetch');
 const {WikidataSync}=await import('@/app/lib/wikidata/sync');
 const discovery=new DiscoveryPrefetch(fixture.load);
 return {movieSync:new WikidataSync(fixture.detail),wikidata:{prefetchDiscovery:()=>discovery.tick(),discover:vi.fn(async()=>({results:[]}))}};
});
import {startLocalMovieSync} from '@/app/services/movieSyncService';

it('runs idle discovery with normal accounts and advances even when saved-mapping reads fail, without touching member data or refreshing unseen details',async()=>{
 vi.useFakeTimers();vi.setSystemTime(0);vi.spyOn(console,'info').mockImplementation(()=>{});
 let stop:(()=>void)|undefined;
 try{
  vi.stubEnv('TALARAMA_LOCAL_PREVIEW','');vi.stubEnv('NEXTAUTH_URL','http://127.0.0.1:3000');vi.stubEnv('CATALOG_PROVIDER','wikidata');vi.stubEnv('NEXT_PHASE','phase-production-server');
  vi.stubEnv('TALARAMA_MOVIE_SYNC','0');expect(startLocalMovieSync()).toBeUndefined();await vi.advanceTimersByTimeAsync(60000);expect(fixture.load).not.toHaveBeenCalled();
  vi.stubEnv('TALARAMA_MOVIE_SYNC','1');fixture.read.mockRejectedValueOnce(Error('Temporary fixture DB outage'));
  stop=startLocalMovieSync();await vi.advanceTimersByTimeAsync(180000);
  expect(fixture.load.mock.calls.map(([page])=>page)).toEqual([1,2,3]);
  expect(fixture.read).toHaveBeenCalledTimes(3);expect(fixture.read).toHaveBeenLastCalledWith({where:{provider:'WIKIDATA'},select:{externalId:true},orderBy:{externalId:'asc'},take:12});
  expect(fixture.detail).not.toHaveBeenCalled();
  stop?.();await vi.advanceTimersByTimeAsync(180000);expect(fixture.load).toHaveBeenCalledTimes(3);
 }finally{stop?.();vi.unstubAllEnvs();vi.restoreAllMocks();vi.useRealTimers();}
});

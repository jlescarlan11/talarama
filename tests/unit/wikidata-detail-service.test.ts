// @vitest-environment node
import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const mocks=vi.hoisted(()=>({identity:vi.fn(),like:vi.fn(),watch:vi.fn(),details:vi.fn()}));
vi.mock('@/prisma/client',()=>({default:{externalMovieIdentity:{findUnique:mocks.identity},likedBy:{findUnique:mocks.like},watchlistEntry:{findUnique:mocks.watch}}}));
vi.mock('@/app/lib/wikidata/server',()=>({wikidata:{details:mocks.details}}));
import {getWikidataMovieDetail} from '@/app/services/wikidataDetailService';
it('marks cached public details as unavailable while preserving mapped IDs and independent member library state',async()=>{
 const movie={wikidataId:'Q100',localId:null,title:'Cached details',stale:true};
 mocks.details.mockResolvedValue(movie);mocks.like.mockResolvedValue({});mocks.watch.mockResolvedValue(null);
 for(const linked of [true,false]){
  mocks.identity.mockResolvedValue(linked?{movie:{id:'unchanged-local'}}:null);
  expect(await getWikidataMovieDetail('Q100','member-a')).toMatchObject({localId:linked?'unchanged-local':null,providerUnavailable:true,favorite:linked,watchlist:false,movie});
 }
});
it('keeps the saved local identity and per-member library state during provider failure',async()=>{
 mocks.identity.mockResolvedValue({movie:{id:'unchanged-local',title:'Saved movie',description:'Keep snapshot',releasedYear:2010,duration:148,posterUrl:null,backdropUrl:null,credits:{cast:[],directors:[]},genres:[]}});
 mocks.details.mockRejectedValue(Error('outage'));mocks.like.mockResolvedValue({});mocks.watch.mockResolvedValue(null);
 const detail=await getWikidataMovieDetail('Q25188','member-a');
 expect(detail).toMatchObject({localId:'unchanged-local',providerUnavailable:true,favorite:true,watchlist:false,movie:{wikidataId:'Q25188',tmdbId:null,title:'Saved movie',description:'Keep snapshot'}});
 expect(mocks.like).toHaveBeenCalledWith({where:{movieId_userId:{movieId:'unchanged-local',userId:'member-a'}}});
 mocks.like.mockClear();await getWikidataMovieDetail('Q25188');expect(mocks.like).not.toHaveBeenCalled();
});
it('isolates malformed or mismatched poster credits from preserved cast and director snapshots',async()=>{
 const person={wikidataId:'Q25191',name:'Saved director',character:''};
 for(const posterCredit of [{sourceUrl:'javascript:bad'}, {url:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Wrong.jpg',sourceUrl:'https://commons.wikimedia.org/wiki/File:Wrong.jpg',license:'CC0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',artist:'Artist',credit:''}]){
  mocks.identity.mockResolvedValue({movie:{id:'unchanged-local',title:'Saved',posterUrl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Actual.jpg',credits:{cast:[person],directors:[person],posterCredit},genres:[]}});
  mocks.details.mockRejectedValue(Error('outage'));
  const result=await getWikidataMovieDetail('Q25188');
  expect(result?.movie.cast).toEqual([person]);expect(result?.movie.directors).toEqual([person]);expect(result?.movie.posterCredit).toBeUndefined();
 }
});

// @vitest-environment node
import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const mocks=vi.hoisted(()=>({identity:vi.fn(),like:vi.fn(),watch:vi.fn(),details:vi.fn()}));
vi.mock('@/prisma/client',()=>({default:{externalMovieIdentity:{findUnique:mocks.identity},likedBy:{findUnique:mocks.like},watchlistEntry:{findUnique:mocks.watch}}}));
vi.mock('@/app/lib/wikidata/server',()=>({wikidata:{details:mocks.details}}));
import {getWikidataMovieDetail} from '@/app/services/wikidataDetailService';
it('keeps the saved local identity and per-member library state during provider failure',async()=>{
 mocks.identity.mockResolvedValue({movie:{id:'unchanged-local',title:'Saved movie',description:'Keep snapshot',releasedYear:2010,duration:148,posterUrl:null,backdropUrl:null,credits:{cast:[],directors:[]},genres:[]}});
 mocks.details.mockRejectedValue(Error('outage'));mocks.like.mockResolvedValue({});mocks.watch.mockResolvedValue(null);
 const detail=await getWikidataMovieDetail('Q25188','member-a');
 expect(detail).toMatchObject({localId:'unchanged-local',providerUnavailable:true,favorite:true,watchlist:false,movie:{wikidataId:'Q25188',tmdbId:null,title:'Saved movie',description:'Keep snapshot'}});
 expect(mocks.like).toHaveBeenCalledWith({where:{movieId_userId:{movieId:'unchanged-local',userId:'member-a'}}});
 mocks.like.mockClear();await getWikidataMovieDetail('Q25188');expect(mocks.like).not.toHaveBeenCalled();
});

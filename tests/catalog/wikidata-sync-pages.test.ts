// @vitest-environment node
import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const fixture=vi.hoisted(()=>({page:{source:'wikidata',order:'recent',page:1,totalPages:1,totalResults:1,results:[{wikidataId:'Q1',title:'Verified discovery film',releasedYear:2026,posterUrl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Poster.jpg'}]}}));
vi.mock('@/app/lib/wikidata/client',()=>({WikidataClient:class {
 async discover(){return fixture.page;}
 async search(){return fixture.page;}
 async details(){return {...fixture.page.results[0],posterUrl:null};}
}}));
import {wikidata} from '@/app/lib/wikidata/server';
it('keeps verified discovery artwork and ordering when a detail cache has no poster',async()=>{
 await wikidata.details('Q1');
 expect(await wikidata.discover()).toEqual(fixture.page);
 expect(await wikidata.search({query:'film'})).toEqual(fixture.page);
});

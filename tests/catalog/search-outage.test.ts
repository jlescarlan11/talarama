// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
vi.mock('server-only',()=>({}));
import {WikidataClient} from '@/app/lib/wikidata/client';
import {LocalDiscoveryCache} from '@/app/lib/wikidata/local-discovery-cache';
const directories:string[]=[];
afterEach(async()=>{vi.useRealTimers();await Promise.all(directories.splice(0).map(path=>rm(path,{recursive:true,force:true})));});
async function fixture(){
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-21T12:00:00Z'));
 const root=await mkdtemp(join(tmpdir(),'talarama-search-outage-'));directories.push(root);
 const state={down:false,artworkDown:false,malformed:false,recovered:false,empty:false,reads:0,status:503};
 const value=(value:unknown)=>({mainsnak:{datavalue:{value}}});
 const fetcher:typeof fetch=async input=>{
  const url=new URL(String(input));
  if(url.hostname==='commons.wikimedia.org')return state.artworkDown?Response.json({},{status:503}):Response.json({query:{pages:[{title:'File:Fixture poster.jpg',imagerepository:'local',imageinfo:[{width:100,height:150,mime:'image/jpeg',thumburl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Fixture_poster.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Fixture_poster.jpg',extmetadata:{License:{value:'pd'},LicenseShortName:{value:'Public domain'},AttributionRequired:{value:'false'}}}]}]}});
  state.reads++;
  if(state.down)return Response.json({},{status:state.status});if(state.malformed)return Response.json({unexpected:true});
  if(url.hostname==='query.wikidata.org'){
   const offset=Number(/OFFSET (\d+)/.exec(url.searchParams.get('query')!)?.[1]??0);
   return Response.json({results:{bindings:state.empty?[]:Array.from({length:13},(_,index)=>({film:{value:`http://www.wikidata.org/entity/Q${100+offset+index}`}}))}});
  }
  if(url.searchParams.get('list')==='search'){
   const offset=Number(url.searchParams.get('sroffset')??0);
   return Response.json({query:{searchinfo:{totalhits:state.empty?0:7501},search:state.empty?[]:[{title:`Q${100+offset}`} ]}});
  }
  return Response.json({entities:Object.fromEntries((url.searchParams.get('ids')||'').split('|').map(id=>[id,{id,labels:{en:{value:`${state.recovered?'Recovered':'Cached'} ${id}`}},claims:{P31:[value({id:'Q11424'})],P577:[value({time:'+2025-01-01T00:00:00Z',precision:11})],P3383:[value('Fixture poster.jpg')]}}]))});
 };
 const client=()=>new WikidataClient({fetcher,wikipediaPreview:false,persistence:new LocalDiscoveryCache(root)});
 return {root,state,client};
}
const selections=[
 {name:'title search',input:{query:'Private fixture title'}},
 {name:'year discovery',input:{year:2025}},
 {name:'genre discovery',input:{genre:28}},
 {name:'genre and year discovery',input:{genre:28,year:2025}},
 {name:'title and year search',input:{query:'Private fixture title',year:2025}},
];
it.each(selections)('backs up $name across restart, preserves page semantics and refreshes on recovery without renewing stale metadata',async({input})=>{
 const {root,state,client}=await fixture();
 const load=(c:WikidataClient)=>input.query!==undefined?c.search({query:input.query,year:input.year,page:2}):c.discover({...input,page:2});
 const original=await load(client());expect(original.results[0].wikidataId).toBe('Q112');
 expect(original).toMatchObject('year'in input?{order:'identifier',hasMore:true,totalResults:25,totalPages:3}:{order:'coverage',totalResults:7501,totalPages:500});
 const file=join(root,'discovery-v1.json'),before=await readFile(file,'utf8');
 expect(before).not.toMatch(/Private fixture title|posterUrl|posterCredit|localId|https?:\/\//);
 vi.setSystemTime(Date.now()+3600001);state.down=true;
 const cold=client();expect(await load(cold)).toEqual({...original,stale:true});
 const attempts=state.reads;vi.setSystemTime(Date.now()+30000);await load(cold);expect(state.reads).toBe(attempts);
 expect(await readFile(file,'utf8')).toBe(before);
 vi.setSystemTime(Date.now()+30001);state.down=false;state.recovered=true;
 const fresh=await load(cold);expect(fresh).not.toHaveProperty('stale');expect(fresh.results[0]).toMatchObject({wikidataId:'Q112',title:'Recovered Q112'});
});
it('never substitutes another title, filter combination or page, and validates inputs and upstream responses',async()=>{
 const {state,client}=await fixture();const warm=client();
 await warm.search({query:'First title'});await warm.discover({genre:28});await warm.discover({year:2025});
 state.down=true;
 for(const request of [()=>client().search({query:'Second title'}),()=>client().search({query:'First title',page:2}),()=>client().search({query:'First title',year:2025}),()=>client().discover({genre:35}),()=>client().discover({year:2024}),()=>client().discover({genre:28,year:2025})])await expect(request()).rejects.toMatchObject({code:'UNAVAILABLE'});
 await expect(client().search({query:'First title',page:0})).rejects.toMatchObject({code:'INVALID_INPUT'});
 state.down=false;state.malformed=true;
 await expect(client().search({query:'First title'})).rejects.toMatchObject({code:'INVALID_RESPONSE'});
 await expect(client().discover({genre:28})).rejects.toMatchObject({code:'INVALID_RESPONSE'});
});
it('replaces old matches with confirmed empty results and preserves the empty backup during subsequent outages',async()=>{
 const {state,client}=await fixture();await client().search({query:'Gone title'});state.empty=true;
 expect((await client().search({query:'Gone title'})).results).toEqual([]);state.down=true;
 expect(await client().search({query:'Gone title'})).toMatchObject({stale:true,results:[],totalResults:0,totalPages:0});
});
it('normalizes only surrounding query whitespace and default page, without extending the original successful backup expiry',async()=>{
 const {root,state,client}=await fixture();const warm=client();await warm.search({query:' First title '});
 const file=join(root,'discovery-v1.json'),before=await readFile(file,'utf8');vi.setSystemTime(Date.now()+120000);
 await warm.search({page:1,query:'First title'});expect(await readFile(file,'utf8')).toBe(before);
 state.down=true;expect(await client().search({query:' First title ',page:1})).toMatchObject({stale:true,results:[{wikidataId:'Q100'}]});
});
it('keeps verified posters in memory during artwork outages and uses placeholders after restart until artwork recovers',async()=>{
 const {state,client}=await fixture();const warm=client(),original=await warm.search({query:'Poster title'});
 vi.setSystemTime(Date.now()+3600001);state.down=true;state.artworkDown=true;
 expect((await warm.search({query:'Poster title'})).results[0].posterUrl).toBe(original.results[0].posterUrl);
 const cold=client();expect((await cold.search({query:'Poster title'})).results[0]).toMatchObject({wikidataId:'Q100',posterUrl:null});
 state.down=false;state.artworkDown=false;vi.setSystemTime(Date.now()+60001);
 expect((await cold.search({query:'Poster title'})).results[0].posterUrl).toBe(original.results[0].posterUrl);
});
it('uses cached matches during rate limiting, respects Retry-After, then recovers',async()=>{
 const {state,client}=await fixture();await client().search({query:'Limited title'});state.down=true;state.status=429;
 const cold=client();expect(await cold.search({query:'Limited title'})).toMatchObject({stale:true});
 state.down=false;state.recovered=true;vi.setSystemTime(Date.now()+60001);
 expect((await cold.search({query:'Limited title'})).results[0].title).toBe('Recovered Q100');
});
it('rejects invalid cached pagination and remains usable when persistence is disabled',async()=>{
 const {root,state,client}=await fixture();await client().discover({genre:28});
 const file=join(root,'discovery-v1.json'),data=JSON.parse(await readFile(file,'utf8'));data.entries[0].totalPages=2;await writeFile(file,JSON.stringify(data));
 state.down=true;await expect(client().discover({genre:28})).rejects.toMatchObject({code:'UNAVAILABLE'});
 const plain=new WikidataClient({fetcher:async()=>Response.json({},{status:503})});
 await expect(plain.search({query:'First title'})).rejects.toMatchObject({code:'UNAVAILABLE'});
});

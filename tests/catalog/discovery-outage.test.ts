// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
vi.mock('server-only',()=>({}));
import {WikidataClient} from '@/app/lib/wikidata/client';
import {LocalDiscoveryCache} from '@/app/lib/wikidata/local-discovery-cache';
import {DiscoveryPrefetch} from '@/app/lib/wikidata/discovery-prefetch';
const directories:string[]=[];
afterEach(async()=>{vi.useRealTimers();await Promise.all(directories.splice(0).map(path=>rm(path,{recursive:true,force:true})));});
async function fixture(){
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-21T12:00:00Z'));
 const root=await mkdtemp(join(tmpdir(),'talarama-outage-'));directories.push(root);
 const state={down:false,artworkDown:false,malformed:false,recovered:false,deep:false,reads:0};
 const value=(value:unknown)=>({mainsnak:{datavalue:{value}}});
 const fetcher:typeof fetch=async input=>{
  const url=new URL(String(input));
  if(url.hostname==='commons.wikimedia.org')return state.artworkDown?Response.json({},{status:503}):Response.json({query:{pages:[{title:'File:Fixture poster.jpg',imagerepository:'local',imageinfo:[{width:100,height:150,mime:'image/jpeg',thumburl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Fixture_poster.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Fixture_poster.jpg',extmetadata:{License:{value:'pd'},LicenseShortName:{value:'Public domain'},AttributionRequired:{value:'false'}}}]}]}});
  state.reads++;
  if(state.down)return Response.json({},{status:503});if(state.malformed)return Response.json({unexpected:true});
  if(url.hostname==='query.wikidata.org'){
   const query=url.searchParams.get('query')!,cursor=/entity\/(Q\d+)"/.exec(query)?.[1];
   const offset=state.deep&&cursor?Number(cursor.slice(1))-99:0,limit=state.deep?Number(/LIMIT (\d+)/.exec(query)?.[1]):13;
   return Response.json({results:{bindings:(query.includes('?date >= "2026-')?Array.from({length:limit},(_,index)=>`Q${100+offset+index}`):[]).map((id,index)=>({film:{value:`http://www.wikidata.org/entity/${id}`},links:{value:String(10000-offset-index)}}))}});
  }
  if(url.searchParams.get('list')==='search')return Response.json({query:{search:[]}});
  return Response.json({entities:Object.fromEntries((url.searchParams.get('ids')||'').split('|').map(id=>[id,{id,labels:{en:{value:`${state.recovered?'Recovered':'Cached'} ${id}`}},claims:{P31:[value({id:'Q11424'})],P577:[value({time:'+2026-01-01T00:00:00Z',precision:11})],P3383:[value('Fixture poster.jpg')]}}]))});
 };
 const client=()=>new WikidataClient({fetcher,wikipediaPreview:false,persistence:new LocalDiscoveryCache(root)});
 return {root,state,client};
}
it('keeps the exact cached page visible through an outage and restart across midnight, then replaces it on recovery without renewing stale metadata',async()=>{
 const {root,state,client}=await fixture();const first=client();
 await first.discover();const original=await first.discover({page:2});expect(original.results.map(movie=>movie.wikidataId)).toEqual(['Q112']);
 const before=JSON.parse(await readFile(join(root,'discovery-v1.json'),'utf8'));
 vi.setSystemTime(new Date('2026-10-22T00:01:00Z'));state.down=true;
 const cold=client();const fallback=await cold.discover({page:2});
 expect(fallback).toMatchObject({stale:true,page:2,hasMore:false,results:[{wikidataId:'Q112',title:'Cached Q112'}]});
 expect(fallback.results[0].posterUrl).toBe('https://upload.wikimedia.org/wikipedia/commons/a/ab/Fixture_poster.jpg');
 const attempts=state.reads;await cold.discover();await cold.discover({page:2});expect(state.reads).toBe(attempts);
 const after=JSON.parse(await readFile(join(root,'discovery-v1.json'),'utf8'));expect(after).toEqual(before);
 expect(JSON.stringify(after)).not.toMatch(/https?:\/\/|posterUrl|posterCredit|localId/);
 state.down=false;state.recovered=true;vi.setSystemTime(Date.now()+60001);
 const fresh=await cold.discover({page:2});expect(fresh.results[0]).toMatchObject({wikidataId:'Q112',title:'Recovered Q112'});expect(fresh).not.toHaveProperty('stale',true);
});
it('retains verified artwork in memory during artwork failure, but uses the original fallback art after a cold restart without persisting image URLs',async()=>{
 const {state,client}=await fixture();const warm=client();const original=await warm.discover();
 vi.setSystemTime(Date.now()+3600001);state.down=true;state.artworkDown=true;
 expect((await warm.discover()).results[0].posterUrl).toBe(original.results[0].posterUrl);
 const cold=await client().discover();expect(cold.results).toHaveLength(12);expect(cold.results[0]).toMatchObject({wikidataId:'Q100',posterUrl:null});
});
it('does not substitute a different cached page, filtered results, malformed source data or an empty cache for unavailable data',async()=>{
 const {state,client}=await fixture();state.down=true;await expect(client().discover()).rejects.toMatchObject({code:'UNAVAILABLE'});
 state.down=false;const warm=client();await warm.discover();vi.setSystemTime(Date.now()+3600001);state.down=true;
 await expect(warm.discover({page:3})).rejects.toMatchObject({code:'UNAVAILABLE'});
 await expect(warm.discover({year:2025})).rejects.toMatchObject({code:'UNAVAILABLE'});
 state.down=false;state.malformed=true;
 await expect(client().discover()).rejects.toMatchObject({code:'INVALID_RESPONSE'});
});
it('keeps the worker at the same frontier while a stale fallback is displayed, then advances after fresh recovery',async()=>{
 let now=0,down=true;const calls:number[]=[];
 const worker=new DiscoveryPrefetch(async page=>{calls.push(page);return {page,totalPages:page,hasMore:!down,results:[],...(down?{stale:true}:{})};},{now:()=>now});
 await expect(worker.tick()).rejects.toThrow();now=60000;down=false;await worker.tick();now=120000;await worker.tick();
 expect(calls).toEqual([1,1,2]);
});
it('does not let a deep-page work limit put healthy homepage refreshes into the outage cooldown',async()=>{
 const {state,client}=await fixture();const warm=client();await warm.discover();
 vi.setSystemTime(Date.now()+3600001);state.deep=true;state.recovered=true;
 await expect(warm.discover({page:500})).rejects.toMatchObject({code:'TIMEOUT'});
 const home=await warm.discover();expect(home).not.toHaveProperty('stale',true);expect(home.results[0].title).toBe('Recovered Q100');
});

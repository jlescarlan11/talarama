// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {WikidataSync,localMovieSyncEnabled} from '@/app/lib/wikidata/sync';
import type {WikidataMovie} from '@/app/lib/tmdb/types';
import {WikidataClient} from '@/app/lib/wikidata/client';
const movie=(title='First',posterUrl:string|null='https://upload.wikimedia.org/wikipedia/commons/a/ab/Poster.jpg'):WikidataMovie=>({localId:null,wikidataId:'Q1',tmdbId:null,title,description:'Description',releasedYear:2026,duration:120,posterUrl,backdropUrl:null,tmdbScore:null,tmdbVoteCount:null,genres:[],cast:[],directors:[]});
afterEach(()=>vi.useRealTimers());
it('refreshes details and posters while idle and coalesces simultaneous reads',async()=>{
 vi.useFakeTimers();let version=movie();const load=vi.fn(async()=>version);
 const sync=new WikidataSync(load,{ttlMs:1000,retryMs:100});
 const stop=sync.start(async()=>['Q1'],100);
 await vi.advanceTimersByTimeAsync(100);
 expect(await sync.details('Q1')).toMatchObject({title:'First'});
 version=movie('Updated','https://upload.wikimedia.org/wikipedia/commons/a/ab/New.jpg');
 await vi.advanceTimersByTimeAsync(1100);
 expect(load).toHaveBeenCalledTimes(2);
 expect(await sync.details('Q1')).toMatchObject({title:'Updated',posterUrl:version.posterUrl});
 stop();await vi.advanceTimersByTimeAsync(2000);expect(load).toHaveBeenCalledTimes(2);
});
it('retains last successful data on outage, retries, and drops blocked movies',async()=>{
 let now=0;let failure:Error|undefined;
 const sync=new WikidataSync(async()=>{if(failure)throw failure;return movie();},{ttlMs:1000,retryMs:100,now:()=>now});
 await sync.details('Q1');now=1001;failure=Object.assign(Error(),{code:'UNAVAILABLE'});
 await sync.refresh(['Q1']);expect(await sync.details('Q1')).toMatchObject({title:'First'});
 now+=101;failure=Object.assign(Error(),{code:'CONTENT_BLOCKED'});
 await sync.refresh(['Q1']);await expect(sync.details('Q1')).rejects.toMatchObject({code:'CONTENT_BLOCKED'});
});
it('keeps a working poster on artwork outage while syncing details, then retries and removes genuinely absent art',async()=>{
 let now=0;let result:WikidataMovie & {artworkUnavailable?:{commons?:true}}=movie();
 const sync=new WikidataSync(async()=>result,{ttlMs:1000,retryMs:100,now:()=>now});
 const first=await sync.details('Q1');now=1001;
 result={...movie('New details',null),artworkUnavailable:{commons:true}};await sync.refresh();
 expect(sync.peek('Q1')).toMatchObject({title:'New details',posterUrl:first.posterUrl});
 expect(sync.peek('Q1')).not.toHaveProperty('artworkUnavailable');
 now+=101;result=movie('New details',null);await sync.refresh();
 expect(sync.peek('Q1')?.posterUrl).toBeNull();
});
it('does not retain rejected Commons art just because the Wikipedia fallback is unavailable',async()=>{
 let now=0;let result:WikidataMovie & {artworkUnavailable?:{wikipedia?:true}}=movie();
 const sync=new WikidataSync(async()=>result,{ttlMs:1000,now:()=>now});
 await sync.details('Q1');now=1001;
 result={...movie('Fresh details',null),artworkUnavailable:{wikipedia:true}};
 await sync.refresh();expect(sync.peek('Q1')?.posterUrl).toBeNull();
});
it('bounds work, never overlaps cycles, and only sends validated public identifiers',async()=>{
 vi.useFakeTimers();let active=0,max=0;
 const load=vi.fn(async(id:string)=>{active++;max=Math.max(max,active);await new Promise(r=>setTimeout(r,50));active--;return {...movie(),wikidataId:id};});
 const sync=new WikidataSync(load,{ttlMs:1000,batchSize:4});
 const stop=sync.start(async()=>['Q1','Q2','Q3','Q4','Q5','member-secret','../Q6'],10);
 await vi.advanceTimersByTimeAsync(120);stop();
 expect(max).toBeLessThanOrEqual(2);expect(load.mock.calls.every(([id])=>/^Q\d+$/.test(id))).toBe(true);
 expect(load.mock.calls.length).toBeLessThanOrEqual(5);
});
it('only enables the background worker for the explicit loopback Wikidata preview',()=>{
 const env={TALARAMA_LOCAL_PREVIEW:'wikidata',NEXTAUTH_URL:'http://127.0.0.1:3000'};
 expect(localMovieSyncEnabled(env)).toBe(true);
 expect(localMovieSyncEnabled({...env,NEXTAUTH_URL:'https://example.com'})).toBe(false);
 expect(localMovieSyncEnabled({...env,CATALOG_PROVIDER:'tmdb'})).toBe(false);
 expect(localMovieSyncEnabled({...env,NEXT_PHASE:'phase-production-build'})).toBe(false);
});
it('expires the actual Wikidata and Commons caches so an idle sweep gets upstream changes',async()=>{
 vi.useFakeTimers();let version=1;let artworkOutage=false;
 const statement=(value:unknown)=>({mainsnak:{datavalue:{value}}});
 const fetcher=vi.fn<typeof fetch>(async input=>{
  const url=new URL(String(input));
  if(url.hostname==='commons.wikimedia.org'){
   if(artworkOutage)return new Response('',{status:503});
   return Response.json({query:{pages:[{title:'File:Fixture poster.jpg',imagerepository:'local',imageinfo:[{width:100,height:150,mime:'image/jpeg',thumburl:`https://upload.wikimedia.org/wikipedia/commons/${version}/ab/Fixture_poster.jpg`,descriptionurl:'https://commons.wikimedia.org/wiki/File:Fixture_poster.jpg',extmetadata:{License:{value:'pd'},LicenseShortName:{value:'Public domain'},AttributionRequired:{value:'false'}}}]}]}});
  }
  return Response.json({entities:{Q1:{id:'Q1',labels:{en:{value:`Version ${version}`}},claims:{P31:[statement({id:'Q11424'})],P3383:[statement('Fixture poster.jpg')],P2047:[statement({amount:`+${100+version}`,unit:'http://www.wikidata.org/entity/Q7727'})]}}}});
 });
 const client=new WikidataClient({fetcher,wikipediaPreview:false});
 const sync=new WikidataSync(id=>client.details(id));
 const stop=sync.start(async()=>['Q1'],60000);
 await vi.advanceTimersByTimeAsync(60000);
 expect(sync.peek('Q1')).toMatchObject({title:'Version 1',duration:101,posterUrl:expect.stringContaining('/1/ab/')});
 version=2;artworkOutage=true;await vi.advanceTimersByTimeAsync(3600001);
 expect(sync.peek('Q1')).toMatchObject({title:'Version 2',duration:102,posterUrl:expect.stringContaining('/1/ab/')});
 artworkOutage=false;await vi.advanceTimersByTimeAsync(60001);
 expect(sync.peek('Q1')).toMatchObject({title:'Version 2',duration:102,posterUrl:expect.stringContaining('/2/ab/')});
 expect(fetcher).toHaveBeenCalledTimes(5);stop();
});

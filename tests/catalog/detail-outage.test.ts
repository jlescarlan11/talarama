// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
vi.mock('server-only',()=>({}));
import {WikidataClient} from '@/app/lib/wikidata/client';
import {LocalDiscoveryCache} from '@/app/lib/wikidata/local-discovery-cache';
import {WikidataSync} from '@/app/lib/wikidata/sync';
const directories:string[]=[];
afterEach(async()=>{vi.useRealTimers();await Promise.all(directories.splice(0).map(path=>rm(path,{recursive:true,force:true})));});
async function fixture(){
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-10-21T12:00:00Z'));
 const root=await mkdtemp(join(tmpdir(),'talarama-detail-outage-'));directories.push(root);
 const state={down:false,artworkDown:false,longArtwork:false,version:1,mode:'healthy',reads:0};
 const value=(value:unknown)=>({mainsnak:{datavalue:{value}}});
 const fetcher:typeof fetch=async input=>{
  const url=new URL(String(input));
  if(url.hostname==='commons.wikimedia.org')return state.artworkDown?Response.json({},{status:503}):Response.json({query:{pages:[{title:'File:Fixture poster.jpg',imagerepository:'local',imageinfo:[{width:100,height:150,mime:'image/jpeg',thumburl:`https://upload.wikimedia.org/wikipedia/commons/${state.version}/ab/Fixture_poster.jpg`,descriptionurl:'https://commons.wikimedia.org/wiki/File:Fixture_poster.jpg',extmetadata:{License:{value:'pd'},LicenseShortName:{value:'Public domain'},AttributionRequired:{value:'false'}}}]}]}});
  state.reads++;if(state.down)return Response.json({},{status:503});
  if(url.hostname==='query.wikidata.org')return Response.json({results:{bindings:url.searchParams.get('query')!.includes('?date >= "2026-')?[{film:{value:'http://www.wikidata.org/entity/Q100'},links:{value:'10'}}]:[]}});
  if(url.searchParams.get('list')==='search')return Response.json({query:{search:[]}});
  if(url.searchParams.get('props')==='labels')return Response.json({entities:Object.fromEntries((url.searchParams.get('ids')||'').split('|').map(id=>[id,{id,labels:{en:{value:`${id==='Q200'?'Director':id==='Q201'?'Actor':'Genre'} ${state.version}`}}}]))});
  if(state.mode==='missing')return Response.json({entities:{Q100:{id:'Q100',missing:''}}});
  if(state.mode==='invalid')return Response.json({entities:{Q100:{id:'Q101'}}});
  return Response.json({entities:{Q100:{id:'Q100',labels:{en:{value:`Detail ${state.version}`}},descriptions:{en:{value:'Public description'}},claims:{P31:[value({id:state.mode==='blocked'?'Q185529':'Q11424'})],P577:[value({time:'+2026-01-01T00:00:00Z',precision:11})],P2047:[value({amount:`+${100+state.version}`,unit:'http://www.wikidata.org/entity/Q7727'})],P57:[value({id:'Q200'})],P161:[value({id:'Q201'})],P136:[value({id:'Q471839'})],P3383:[value(state.longArtwork?'a'.repeat(241)+'.jpg':'Fixture poster.jpg')]}}}});
 };
 const client=()=>new WikidataClient({fetcher,wikipediaPreview:false,persistence:new LocalDiscoveryCache(root)});
 const sync=()=>{const provider=client();return new WikidataSync(id=>provider.details(id));};
 const file=()=>readFile(join(root,'discovery-v1.json'),'utf8');
 return {state,client,sync,file};
}
it('restores full detail metadata after an outage and restart, then background refresh recovers within a minute without changing the stale snapshot',async()=>{
 const {state,sync,file}=await fixture();await sync().details('Q100');const before=await file();
 expect(before).not.toMatch(/https?:\/\/|posterUrl|posterCredit|localId/);
 vi.setSystemTime(Date.now()+3600001);state.down=true;const cold=sync();
 const cached=await cold.details('Q100');expect(cached).toMatchObject({wikidataId:'Q100',localId:null,title:'Detail 1',duration:101,stale:true,directors:[{name:'Director 1'}],cast:[{name:'Actor 1'}]});
 expect(cached.posterUrl).toContain('/1/ab/');expect(await file()).toBe(before);
 const reads=state.reads;await cold.details('Q100');expect(state.reads).toBe(reads);
 state.down=false;state.version=2;vi.setSystemTime(Date.now()+60001);await cold.refresh();
 expect(await cold.details('Q100')).toMatchObject({wikidataId:'Q100',title:'Detail 2',duration:102,directors:[{name:'Director 2'}],cast:[{name:'Actor 2'}]});
 expect(cold.peek('Q100')).not.toHaveProperty('stale',true);
});
it('can open a discovered cached movie for the first time during an outage, without substituting another identity or retrying repeatedly',async()=>{
 const {state,client}=await fixture();await client().discover();state.down=true;const cold=client();
 expect(await cold.details('Q100')).toMatchObject({wikidataId:'Q100',localId:null,title:'Detail 1',duration:101,stale:true});
 const reads=state.reads;await cold.details('Q100');expect(state.reads).toBe(reads);
 await expect(cold.details('Q999')).rejects.toMatchObject({code:'UNAVAILABLE'});
 await expect(cold.details('../Q100')).rejects.toMatchObject({code:'INVALID_INPUT'});
});
it('removes cached detail fallbacks after confirmed missing or blocked films so a later outage cannot resurrect them',async()=>{
 for(const [mode,code] of [['missing','NOT_FOUND'],['blocked','CONTENT_BLOCKED']]){
  const {state,client,file}=await fixture();const earlier=client();await earlier.details('Q100');
  vi.setSystemTime(Date.now()+3600001);await earlier.discover();state.mode=mode;
  await expect(earlier.details('Q100')).rejects.toMatchObject({code});
  expect(JSON.parse(await file()).entries.every((entry:{movies:{wikidataId:string}[]})=>entry.movies.every(movie=>movie.wikidataId!=='Q100'))).toBe(true);
  // A still-fresh discovery response must not undo the confirmed withdrawal.
  await earlier.discover();state.down=true;
  await expect(client().details('Q100')).rejects.toMatchObject({code:'UNAVAILABLE'});
 }
});
it('retains verified memory artwork on outage, uses placeholders after restart, and restores new posters on recovery without persisting URLs',async()=>{
 const {state,sync,file}=await fixture();const warm=sync();await warm.details('Q100');
 vi.setSystemTime(Date.now()+3600001);state.down=true;state.artworkDown=true;
 await warm.refresh();expect(warm.peek('Q100')).toMatchObject({title:'Detail 1',posterUrl:expect.stringContaining('/1/ab/')});
 const cold=sync();expect(await cold.details('Q100')).toMatchObject({title:'Detail 1',posterUrl:null,stale:true});
 state.down=false;state.artworkDown=false;state.version=2;vi.setSystemTime(Date.now()+60001);await cold.refresh();
 expect(cold.peek('Q100')).toMatchObject({title:'Detail 2',posterUrl:expect.stringContaining('/2/ab/')});expect(cold.peek('Q100')).not.toHaveProperty('stale',true);
 expect(await file()).not.toMatch(/https?:\/\/|posterUrl|posterCredit|localId/);
});
it('does not turn malformed live entity data into a cached-detail success',async()=>{
 const {state,client}=await fixture();await client().details('Q100');state.mode='invalid';
 await expect(client().details('Q100')).rejects.toMatchObject({code:'INVALID_RESPONSE'});
});
it('still backs up valid full details when an overlong artwork candidate must be discarded',async()=>{
 const {state,client}=await fixture();state.longArtwork=true;await client().details('Q100');state.down=true;
 expect(await client().details('Q100')).toMatchObject({title:'Detail 1',duration:101,stale:true,posterUrl:null,directors:[{name:'Director 1'}]});
});

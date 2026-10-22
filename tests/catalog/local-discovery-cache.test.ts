// @vitest-environment node
import {afterEach,expect,it,vi} from 'vitest';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
vi.mock('server-only',()=>({}));
import {LocalDiscoveryCache,localDiscoveryDirectory} from '@/app/lib/wikidata/local-discovery-cache';
import type {DiscoveryMetadata} from '@/app/lib/wikidata/client';
import {DiscoveryPrefetch} from '@/app/lib/wikidata/discovery-prefetch';
const directories:string[]=[];
afterEach(async()=>{await Promise.all(directories.splice(0).map(path=>rm(path,{recursive:true,force:true})));});
const fixture=()=>({metadata:{movies:[{localId:null,wikidataId:'Q100',tmdbId:null,title:'Fixture film',description:'Public metadata',releasedYear:2026,duration:90,posterUrl:'https://upload.wikimedia.org/wikipedia/en/a/ab/Do_not_persist.jpg',posterCredit:{previewOnly:true},backdropUrl:null,tmdbScore:null,tmdbVoteCount:null,genres:[],cast:[],directors:[],memberEmail:'private@example.invalid'}],candidates:new Map([['Q100',{files:[],article:'Fixture film'}]])} as unknown as DiscoveryMetadata,nextCursor:null});
async function directory(){const path=await mkdtemp(join(tmpdir(),'talarama-discovery-'));directories.push(path);return path;}
const key='recent-metadata:2026-10-20:2026:start';

it('enables persistence only at the explicit local preview cache directory',()=>{
 const cwd=join(tmpdir(),'talarama-preview'),path=join(cwd,'.superpowers','wikidata-cache');
 const env={NEXTAUTH_URL:'http://127.0.0.1:3000',TALARAMA_LOCAL_PREVIEW:'wikidata',CATALOG_PROVIDER:'wikidata',TALARAMA_DISCOVERY_CACHE_DIR:path};
 expect(localDiscoveryDirectory(env,cwd)).toBe(path);
 for(const override of [{TALARAMA_DISCOVERY_CACHE_DIR:''},{TALARAMA_DISCOVERY_CACHE_DIR:join(cwd,'other')},{NEXTAUTH_URL:'https://example.com'},{TALARAMA_LOCAL_PREVIEW:''},{NEXT_PHASE:'phase-production-build'},{CATALOG_PROVIDER:'tmdb'}])expect(localDiscoveryDirectory({...env,...override},cwd)).toBeUndefined();
});

it('restores public movie metadata and continuation after a fresh instance, omitting local identities, member fields and preview artwork',async()=>{
 const root=await directory();let now=1000;
 const first=new LocalDiscoveryCache(root,{now:()=>now});
 await first.get(key,async()=>fixture());
 const checkpoint={nextPage:8,nextHeadRefresh:3601000,nextAttempt:61000,complete:false};
 await first.saveProgress(checkpoint);
 const serialized=await readFile(join(root,'discovery-v1.json'),'utf8');
 expect(serialized).not.toContain('Do_not_persist');expect(serialized).not.toContain('private@example.invalid');expect(serialized).not.toContain('localId');
 now=2000;const second=new LocalDiscoveryCache(root,{now:()=>now});const load=vi.fn(async()=>fixture());
 const restored=await second.get(key,load);expect(load).not.toHaveBeenCalled();
 expect(restored.metadata.movies[0]).toMatchObject({wikidataId:'Q100',localId:null,title:'Fixture film',posterUrl:null});
 expect(restored.metadata.candidates.get('Q100')).toEqual({files:[],article:'Fixture film'});
 expect(await second.readProgress()).toEqual(checkpoint);
});
it('retains original expiry across restarts, refreshes stale metadata, and safely replaces a corrupt cache',async()=>{
 const root=await directory();let now=1000;
 await new LocalDiscoveryCache(root,{now:()=>now}).get(key,async()=>fixture());
 now+=3599000;const second=new LocalDiscoveryCache(root,{now:()=>now});await second.get(key,async()=>{throw Error('Must still be fresh');});
 now+=1001;const load=vi.fn(async()=>({...fixture(),nextCursor:{links:10,id:'Q100'}}));
 expect(await second.get(key,load)).toMatchObject({nextCursor:{links:10,id:'Q100'}});expect(load).toHaveBeenCalledTimes(1);
 await writeFile(join(root,'discovery-v1.json'),'{broken');
 const third=new LocalDiscoveryCache(root,{now:()=>now});expect(await third.readProgress()).toBeUndefined();await third.get(key,load);
 expect(JSON.parse(await readFile(join(root,'discovery-v1.json'),'utf8')).version).toBe(1);
});
it('resumes the saved worker frontier after restart and checks an overdue head before continuing that frontier',async()=>{
 const root=await directory();let now=1000;
 const load=vi.fn(async(page:number)=>({page,hasMore:true,totalPages:page+1,results:[]}));
 const first=new DiscoveryPrefetch(load,{now:()=>now,checkpoint:new LocalDiscoveryCache(root,{now:()=>now})});
 await first.tick();now+=60001;
 const second=new DiscoveryPrefetch(load,{now:()=>now,checkpoint:new LocalDiscoveryCache(root,{now:()=>now})});
 await second.tick();now+=3600000;
 const third=new DiscoveryPrefetch(load,{now:()=>now,checkpoint:new LocalDiscoveryCache(root,{now:()=>now})});
 await third.tick();now+=60001;await third.tick();
 expect(load.mock.calls.map(([page])=>page)).toEqual([1,2,1,3]);
});
it('ignores structurally valid files with nonadvancing recent or older cursors instead of looping on cached progress',async()=>{
 for(const recent of [true,false]){
  const root=await directory();const currentKey=recent?'recent-metadata:2026-10-20:2026:10:Q100':'older-metadata:2026-10-20:240';
  const value=recent?fixture():{metadata:{...fixture().metadata,movies:fixture().metadata.movies.map(movie=>({...movie,releasedYear:2000}))},nextOffset:null};
  await new LocalDiscoveryCache(root).get(currentKey,async()=>value);
  const path=join(root,'discovery-v1.json');const file=JSON.parse(await readFile(path,'utf8'));
  if(recent)file.entries[0].nextCursor={links:10,id:'Q100'};else file.entries[0].nextOffset=240;
  await writeFile(path,JSON.stringify(file));const load=vi.fn(async()=>value);
  await new LocalDiscoveryCache(root).get(currentKey,load);expect(load).toHaveBeenCalledTimes(1);
 }
});
it('coalesces metadata writes and keeps memory discovery working when its directory is unwritable',async()=>{
 const root=await directory();const cache=new LocalDiscoveryCache(root);let release!:(value:ReturnType<typeof fixture>)=>void;
 const load=vi.fn(()=>new Promise<ReturnType<typeof fixture>>(resolve=>{release=resolve;}));
 const first=cache.get(key,load),second=cache.get(key,load);await vi.waitFor(()=>expect(load).toHaveBeenCalledTimes(1));release(fixture());await Promise.all([first,second]);
 expect(JSON.parse(await readFile(join(root,'discovery-v1.json'),'utf8')).entries).toHaveLength(1);
 const blocked=join(root,'not-a-directory');await writeFile(blocked,'fixture');const memory=new LocalDiscoveryCache(blocked);const fallback=vi.fn(async()=>fixture());
 await memory.get(key,fallback);expect((await memory.get(key,fallback)).metadata.movies[0].wikidataId).toBe('Q100');expect(fallback).toHaveBeenCalledTimes(1);
});

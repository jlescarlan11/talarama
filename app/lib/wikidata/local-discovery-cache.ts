import {mkdir,open,rename,unlink} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {randomUUID} from 'node:crypto';
import {z} from 'zod';
import type {DiscoveryMetadata} from './client';
import type {CatalogPage,WikidataMovie} from '@/app/lib/tmdb/types';
import {localMovieSyncEnabled,MOVIE_SYNC_TTL_MS} from './sync';

export type DiscoveryProgress={nextPage:number;nextHeadRefresh:number;nextAttempt:number;complete:boolean};
export type DiscoverySnapshot={metadata:DiscoveryMetadata;nextCursor:{links:number;id:string}|null}|{metadata:DiscoveryMetadata;nextOffset:number|null};
const id=z.string().regex(/^Q[1-9]\d{0,11}$/);
const time=z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const person=z.object({wikidataId:id,name:z.string().max(500)});
const movie=z.object({wikidataId:id,title:z.string().max(500),description:z.string().max(3000).nullable(),releasedYear:z.number().int().min(1800).max(9999).nullable(),duration:z.number().int().min(0).max(100000).nullable(),genres:z.array(person).max(10),directors:z.array(person).max(10),cast:z.array(person.extend({character:z.string().max(500)})).max(20)});
const candidate=z.object({id,files:z.array(z.object({file:z.string().max(240),explicitPoster:z.boolean()})).max(4),article:z.string().max(240).optional()});
const common={key:z.string().max(180),expires:time,movies:z.array(movie).max(240),candidates:z.array(candidate).max(240)};
const entrySchema=z.discriminatedUnion('kind',[
 z.object({...common,kind:z.literal('recent'),nextCursor:z.object({links:z.number().int().min(1).max(9999999),id}).nullable()}),
 z.object({...common,kind:z.literal('older'),nextOffset:z.number().int().min(1).max(10000).nullable()}),
 z.object({...common,kind:z.literal('page'),movies:z.array(movie).max(12),candidates:z.array(candidate).max(12),page:z.number().int().min(1).max(500),hasMore:z.boolean(),totalPages:z.number().int().min(0).max(500),totalResults:z.number().int().min(0).max(6000)}),
 z.object({...common,kind:z.literal('list'),movies:z.array(movie).max(12),candidates:z.array(candidate).max(12),page:z.number().int().min(1).max(500),hasMore:z.boolean().optional(),order:z.enum(['coverage','identifier']),totalPages:z.number().int().min(0).max(500),totalResults:z.number().int().min(0).max(Number.MAX_SAFE_INTEGER)}),
 z.object({...common,kind:z.literal('detail'),movies:z.array(movie).max(1),candidates:z.array(candidate).max(1)}),
]);
const progressSchema=z.object({nextPage:z.number().int().min(1).max(500),nextHeadRefresh:time,nextAttempt:time,complete:z.boolean()});
type Entry=z.infer<typeof entrySchema>;
const maximumBytes=16*1024*1024;
const recentKey=/^recent-metadata:\d{4}-\d{2}-\d{2}:\d{4}:(?:start|[1-9]\d{0,6}:Q[1-9]\d{0,11})$/;
const olderKey=/^older-metadata:\d{4}-\d{2}-\d{2}:\d{1,5}$/;

export function localDiscoveryDirectory(env:Record<string,string|undefined>=process.env,cwd=process.cwd()){
 const expected=resolve(cwd,'.superpowers/wikidata-cache');
 return localMovieSyncEnabled(env)&&(env.TALARAMA_DISCOVERY_CACHE_DIR===undefined||!!env.TALARAMA_DISCOVERY_CACHE_DIR&&resolve(env.TALARAMA_DISCOVERY_CACHE_DIR)===expected)?expected:undefined;
}

/** Public metadata only. Thumbnail URLs, artwork credits, local identities and
 * member fields have no fields in this on-disk format. Artwork is revalidated.
 */
export class LocalDiscoveryCache {
 private entries=new Map<string,Entry>();
 private pending=new Map<string,Promise<DiscoverySnapshot>>();
 private progress?:DiscoveryProgress;
 private ready:Promise<void>;
 private writing=Promise.resolve();
 private warned=false;
 private file:string;
 constructor(private readonly directory:string,private readonly options:{now?:()=>number}={}){
  this.file=join(directory,'discovery-v1.json');this.ready=this.restore();
 }
 private now(){return(this.options.now||Date.now)();}
 private warning(){if(!this.warned){this.warned=true;console.info('[movie-sync] Local discovery cache unavailable or invalid; memory discovery remains active.');}}
 private metadata(entry:Entry):DiscoveryMetadata{
  return {movies:entry.movies.map(value=>({...value,localId:null,tmdbId:null,tmdbVoteCount:null,tmdbScore:null,posterUrl:null,backdropUrl:null})),candidates:new Map(entry.candidates.map(({id,...sources})=>[id,sources]))};
 }
 private decode(entry:Exclude<Entry,{kind:'page'|'detail'|'list'}>):DiscoverySnapshot{
  const metadata=this.metadata(entry);
  return entry.kind==='recent'?{metadata,nextCursor:entry.nextCursor}:{metadata,nextOffset:entry.nextOffset};
 }
 private encode(key:string,value:DiscoverySnapshot):Entry|undefined{
  const candidates=value.metadata.movies.map(row=>{const source=value.metadata.candidates.get(row.wikidataId);return {id:row.wikidataId,files:(source?.files||[]).filter(file=>file.file.length<=240),...(source?.article&&source.article.length<=240?{article:source.article}:{})};});
  const data={key,expires:this.now()+MOVIE_SYNC_TTL_MS,movies:value.metadata.movies,candidates,...('nextCursor'in value?{kind:'recent',nextCursor:value.nextCursor}:{kind:'older',nextOffset:value.nextOffset})};
  const parsed=entrySchema.safeParse(data);
  if(!parsed.success)return;
  return parsed.data;
 }
 private valid(entry:Entry){
  const ids=new Set(entry.movies.map(value=>value.wikidataId));
  if(entry.expires>this.now()+MOVIE_SYNC_TTL_MS||ids.size!==entry.movies.length||entry.candidates.length!==ids.size||!entry.candidates.every(value=>ids.has(value.id))||new Set(entry.candidates.map(value=>value.id)).size!==ids.size)return false;
  if(entry.kind==='page')return entry.key===`page:${entry.page}`&&entry.totalPages===Math.ceil(entry.totalResults/12)&&(!entry.hasMore||(entry.page<500&&entry.totalResults>entry.page*12));
  if(entry.kind==='list')return /^list:[a-f0-9]{64}$/.test(entry.key)&&entry.totalPages===Math.min(500,Math.ceil(entry.totalResults/12))&&(!entry.hasMore||entry.totalResults>entry.page*12);
  if(entry.kind==='detail')return /^detail:Q[1-9]\d{0,11}$/.test(entry.key)&&(!entry.movies.length||entry.key===`detail:${entry.movies[0].wikidataId}`);
  if(!(entry.kind==='recent'?recentKey:olderKey).test(entry.key))return false;
  const parts=entry.key.split(':');
  if(entry.kind==='recent'){
   const year=Number(parts[2]);
   if(!entry.movies.every(value=>value.releasedYear===year))return false;
   if(parts[3]!=='start'&&entry.nextCursor){
    const links=Number(parts[3]);
    if(!(entry.nextCursor.links<links||(entry.nextCursor.links===links&&entry.nextCursor.id>parts[4])))return false;
   }
  }else{
   const offset=Number(parts[2]),recentYear=Number(parts[1].slice(0,4))-2;
   if(offset>=10000||!entry.movies.every(value=>value.releasedYear!==null&&value.releasedYear<recentYear))return false;
   if(entry.nextOffset!==null&&!(entry.nextOffset>offset&&entry.nextOffset<=offset+(offset===0?240:48)&&entry.nextOffset<10000))return false;
  }
  return true;
 }
 async get<T extends DiscoverySnapshot>(key:string,load:()=>Promise<T>):Promise<T>{
  await this.ready;
  const existing=this.entries.get(key);
  if(existing&&existing.kind!=='page'&&existing.kind!=='detail'&&existing.kind!=='list'&&existing.expires>this.now()){
   this.entries.delete(key);this.entries.set(key,existing);return this.decode(existing) as T;
  }
  const pending=this.pending.get(key);if(pending)return pending as Promise<T>;
  const request=Promise.resolve().then(load).then(async value=>{
   const encoded=this.encode(key,value);
   if(encoded&&this.valid(encoded)){this.entries.delete(key);this.entries.set(key,encoded);await this.persist();}
   return value;
  }).finally(()=>this.pending.delete(key));
  this.pending.set(key,request);return request;
 }
 async savePage(value:CatalogPage<WikidataMovie>){
  await this.ready;
  const sources=new Map<string,Entry['candidates'][number]>();
  for(const entry of [...this.entries.values()].reverse())for(const candidate of entry.candidates)if(!sources.has(candidate.id))sources.set(candidate.id,candidate);
  const parsed=entrySchema.safeParse({kind:'page',key:`page:${value.page}`,expires:this.now()+MOVIE_SYNC_TTL_MS,page:value.page,hasMore:value.hasMore??value.totalPages>value.page,totalPages:value.totalPages,totalResults:value.totalResults,movies:value.results,candidates:value.results.map(movie=>sources.get(movie.wikidataId)??{id:movie.wikidataId,files:[]})});
  if(parsed.success&&this.valid(parsed.data)){this.entries.delete(parsed.data.key);this.entries.set(parsed.data.key,parsed.data);await this.persist();}
 }
 async cachedPage(page:number){
  await this.ready;const entry=this.entries.get(`page:${page}`);if(entry?.kind!=='page')return;
  this.entries.delete(entry.key);this.entries.set(entry.key,entry);
  const metadata=this.metadata(entry);
  const data:CatalogPage<WikidataMovie>={page:entry.page,hasMore:entry.hasMore,totalPages:entry.totalPages,totalResults:entry.totalResults,results:metadata.movies,source:'wikidata',order:'recent',stale:true};
  return {data,candidates:metadata.candidates};
 }
 async saveList(key:string,value:{data:CatalogPage<WikidataMovie>;candidates:DiscoveryMetadata['candidates']}){
  await this.ready;
  const {data,candidates}=value;
  const parsed=entrySchema.safeParse({kind:'list',key,expires:this.now()+MOVIE_SYNC_TTL_MS,page:data.page,hasMore:data.hasMore,order:data.order,totalPages:data.totalPages,totalResults:data.totalResults,movies:data.results,candidates:data.results.map(movie=>{
   const source=candidates.get(movie.wikidataId);
   return {id:movie.wikidataId,files:(source?.files||[]).filter(file=>file.file.length<=240),...(source?.article&&source.article.length<=240?{article:source.article}:{})};
  })});
  if(parsed.success&&this.valid(parsed.data)){this.entries.delete(key);this.entries.set(key,parsed.data);await this.persist();}
 }
 async cachedList(key:string){
  await this.ready;const entry=this.entries.get(key);if(entry?.kind!=='list')return;
  this.entries.delete(key);this.entries.set(key,entry);
  const metadata=this.metadata(entry);
  const data:CatalogPage<WikidataMovie>={page:entry.page,...(entry.hasMore===undefined?{}:{hasMore:entry.hasMore}),totalPages:entry.totalPages,totalResults:entry.totalResults,results:metadata.movies,source:'wikidata',order:entry.order,stale:true};
  return {data,candidates:metadata.candidates};
 }
 async saveDetail(metadata:DiscoveryMetadata){
  await this.ready;if(metadata.movies.length!==1)return;
  const movie=metadata.movies[0],sources=metadata.candidates.get(movie.wikidataId);
  const parsed=entrySchema.safeParse({kind:'detail',key:`detail:${movie.wikidataId}`,expires:this.now()+MOVIE_SYNC_TTL_MS,movies:metadata.movies,candidates:[{id:movie.wikidataId,files:(sources?.files||[]).filter(file=>file.file.length<=240),...(sources?.article&&sources.article.length<=240?{article:sources.article}:{})}]});
  if(parsed.success&&this.valid(parsed.data)){this.entries.delete(parsed.data.key);this.entries.set(parsed.data.key,parsed.data);await this.persist();}
 }
 async cachedDetail(id:string){
  await this.ready;const detail=this.entries.get(`detail:${id}`);
  if(detail?.kind==='detail'){
   this.entries.delete(detail.key);this.entries.set(detail.key,detail);
   // An empty detail record is a confirmed withdrawal, not a cache miss.
   return detail.movies.length?this.metadata(detail):undefined;
  }
  for(const entry of [...this.entries.values()].reverse())if(entry.movies.some(movie=>movie.wikidataId===id)){
   this.entries.delete(entry.key);this.entries.set(entry.key,entry);
   return this.metadata({...entry,movies:entry.movies.filter(movie=>movie.wikidataId===id),candidates:entry.candidates.filter(candidate=>candidate.id===id)});
  }
 }
 async discardDetail(id:string){
  await this.ready;if(!/^Q[1-9]\d{0,11}$/.test(id))return;
  for(const [key,entry] of this.entries)if(entry.movies.some(movie=>movie.wikidataId===id))this.entries.set(key,{...entry,movies:entry.movies.filter(movie=>movie.wikidataId!==id),candidates:entry.candidates.filter(candidate=>candidate.id!==id)});
  const marker=entrySchema.parse({kind:'detail',key:`detail:${id}`,expires:this.now()+MOVIE_SYNC_TTL_MS,movies:[],candidates:[]});
  this.entries.delete(marker.key);this.entries.set(marker.key,marker);await this.persist();
 }
 async readProgress(){await this.ready;return this.progress?{...this.progress}:undefined;}
 async saveProgress(value:DiscoveryProgress){
  await this.ready;const parsed=progressSchema.safeParse(value);if(!parsed.success)return;
  this.progress=parsed.data;await this.persist();
 }
 private async restore(){
  let handle:Awaited<ReturnType<typeof open>>|undefined;
  try{
   handle=await open(this.file,'r');
   const buffer=Buffer.alloc(maximumBytes+1);let offset=0;
   while(offset<buffer.length){const {bytesRead}=await handle.read(buffer,offset,buffer.length-offset,offset);if(!bytesRead)break;offset+=bytesRead;}
   if(offset>maximumBytes)throw Error('Oversized discovery cache');
   const file=z.object({version:z.literal(1),entries:z.array(z.unknown()).max(512),progress:z.unknown().optional()}).parse(JSON.parse(buffer.subarray(0,offset).toString('utf8')));
   for(const value of file.entries){const parsed=entrySchema.safeParse(value);if(parsed.success&&this.valid(parsed.data))this.entries.set(parsed.data.key,parsed.data);}
   const progress=progressSchema.safeParse(file.progress);if(progress.success)this.progress=progress.data;
  }catch(error){if(!(error&&typeof error==='object'&&'code'in error&&error.code==='ENOENT'))this.warning();}
  finally{await handle?.close().catch(()=>{});}
 }
 private persist(){
  this.writing=this.writing.then(async()=>{
   const selected:Entry[]=[];let size=4096;
   for(const entry of [...this.entries.values()].reverse()){
    const bytes=Buffer.byteLength(JSON.stringify(entry))+1;
    if(selected.length>=512||size+bytes>maximumBytes)break;
    selected.unshift(entry);size+=bytes;
   }
   this.entries=new Map(selected.map(entry=>[entry.key,entry]));
   const serialized=JSON.stringify({version:1,entries:selected,progress:this.progress});
   const temporary=join(this.directory,`discovery-${randomUUID()}.tmp`);
   try{
    await mkdir(this.directory,{recursive:true});
    const handle=await open(temporary,'wx',0o600);
    try{await handle.writeFile(serialized,'utf8');await handle.sync();}finally{await handle.close();}
    await rename(temporary,this.file);
   }catch{this.warning();}
   finally{await unlink(temporary).catch(()=>{});}
  });
  return this.writing;
 }
}

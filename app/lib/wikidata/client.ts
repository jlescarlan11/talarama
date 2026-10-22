import 'server-only';
import {createHash} from 'node:crypto';
import { z } from 'zod';
import { MetadataCache } from '@/app/lib/tmdb/cache';
import { TmdbError } from '@/app/lib/tmdb/client';
import type { CatalogPage, WikidataMovie,PosterCredit } from '@/app/lib/tmdb/types';
import type {ArtworkFailures} from './sync';
import { genres } from '@/app/lib/movies/catalog-query';
import {CommonsPosters,type PosterCandidate} from './commons-posters';
import {WikipediaPosters,localWikipediaPostersEnabled} from './wikipedia-posters';
import type {LocalDiscoveryCache,DiscoverySnapshot} from './local-discovery-cache';
import {isCommonsPosterUrl,isWikipediaPreviewPosterUrl} from '@/app/lib/movies/poster-credit';

export const wikidataIdSchema = z.string().regex(/^Q[1-9]\d{0,11}$/);
export const wikiGenres: Record<number, string> = { 28:'Q188473',12:'Q319221',16:'Q202866',35:'Q157443',80:'Q959790',99:'Q93204',18:'Q130232',10751:'Q1361932',14:'Q157394',36:'Q17013749',27:'Q200092',10402:'Q842256',9648:'Q1200678',10749:'Q1054574',878:'Q471839',10770:'Q506240',53:'Q2484376',10752:'Q369747',37:'Q172980' };
const filmTypes = new Set(['Q11424','Q24869','Q24862',...Object.values(wikiGenres)]);
const statement = z.object({ rank: z.string().optional(), mainsnak: z.object({ datavalue: z.object({ value: z.unknown() }).optional() }) });
const entitySchema = z.object({ id: wikidataIdSchema, labels: z.record(z.object({ value: z.string().max(500) })).default({}), descriptions: z.record(z.object({ value: z.string().max(3000) })).default({}), claims: z.record(z.array(statement).max(2000)).default({}),sitelinks:z.object({enwiki:z.object({title:z.string().max(240)}).optional()}).optional().catch(undefined) });
type Entity = z.infer<typeof entitySchema>;
type ArtworkSources={files:PosterCandidate[];article?:string};
export type DiscoveryMetadata={movies:WikidataMovie[];candidates:Map<string,ArtworkSources>};
type PosterSelection={metadata:DiscoveryMetadata;batches:Map<number,Promise<WikidataMovie[]>>};
type RecentCursor={links:number;id:string};
type RecentSelection=PosterSelection&{nextCursor:RecentCursor|null};
type OlderSelection=PosterSelection&{nextOffset:number|null};
class OversizedWikidataResponse extends TmdbError { constructor(){super('INVALID_RESPONSE');} }
class DiscoveryWorkLimit extends TmdbError { constructor(){super('TIMEOUT');} }
function values(entity: Entity, property: string) { return (entity.claims[property] || []).filter(s => s.rank !== 'deprecated').map(s => s.mainsnak.datavalue?.value); }
function ids(entity: Entity, property: string): string[] { return values(entity,property).map(value => z.object({ id: wikidataIdSchema }).safeParse(value)).filter(value => value.success).map(value => value.data!.id); }
function years(entity: Entity) { return values(entity,'P577').map(value => z.object({ time:z.string(), precision:z.number().min(9) }).safeParse(value)).filter(value => value.success).map(value => /^\+(\d{4})-/.exec(value.data!.time)?.[1]).filter((year): year is string => !!year).map(Number).filter(year => year >= 1800 && year <= 9999).sort((a,b)=>a-b); }
function validFilm(entity: Entity) {
  const types = ids(entity,'P31');
  if (types.includes('Q185529') || ids(entity,'P136').includes('Q185529') || /\b(pornographic|pornography|adult film)\b/i.test(entity.descriptions.en?.value || '') || !types.some(id => filmTypes.has(id))) throw new TmdbError('CONTENT_BLOCKED');
}
function normalize(entity: Entity, labels = new Map<string,string>()): WikidataMovie {
  validFilm(entity);
  const name = (id: string) => labels.get(id) || genres.find(([key])=>wikiGenres[key]===id)?.[1] || id;
  const length = values(entity,'P2047').map(value => z.object({ amount:z.string(),unit:z.literal('http://www.wikidata.org/entity/Q7727') }).safeParse(value)).find(value=>value.success);
  const duration = length?.success ? Number(length.data.amount) : NaN;
  return { localId:null, wikidataId:entity.id, tmdbId:null, title:entity.labels.en?.value || entity.id, description:entity.descriptions.en?.value || null, releasedYear:years(entity)[0] ?? null, duration:Number.isFinite(duration) && duration > 0 && duration < 100000 ? Math.round(duration) : null, posterUrl:null, backdropUrl:null, tmdbScore:null, tmdbVoteCount:null,
    genres:ids(entity,'P136').slice(0,10).map(id=>({wikidataId:id,name:name(id)})), directors:ids(entity,'P57').slice(0,10).map(id=>({wikidataId:id,name:name(id)})), cast:ids(entity,'P161').slice(0,20).map(id=>({wikidataId:id,name:name(id),character:''})) };
}
/** Public read-only official endpoints. Never sends member state or accepts an upstream URL. */
export class WikidataClient {
  private cache = new MetadataCache();
  private discoveryCache = new MetadataCache(512);
  private blockedUntil = 0;
  private fetcher: typeof fetch;
  private posters:CommonsPosters;
  private wikipedia:WikipediaPosters;
  private wikipediaPreview:boolean;
  private persistence?:LocalDiscoveryCache;
  private discoveryRetryAt=0;
  private discoveryError?:TmdbError;
  private lastDiscoveryPages=new Map<number,CatalogPage<WikidataMovie>>();
  private lastListPages=new Map<string,CatalogPage<WikidataMovie>>();
  private listRetries=new Map<string,{until:number;error:TmdbError}>();
  private detailRetries=new Map<string,{until:number;error:TmdbError}>();
  constructor({ fetcher = fetch,wikipediaPreview=localWikipediaPostersEnabled(),persistence }: { fetcher?: typeof fetch;wikipediaPreview?:boolean;persistence?:LocalDiscoveryCache } = {}) { this.fetcher=fetcher;this.posters=new CommonsPosters({fetcher});this.wikipedia=new WikipediaPosters({fetcher});this.wikipediaPreview=wikipediaPreview;this.persistence=persistence; }
  private cachedDiscovery<T extends DiscoverySnapshot>(key:string,load:()=>Promise<T>):Promise<T>{
    return this.persistence?this.persistence.get(key,load):this.discoveryCache.get(key,3600000,load);
  }
  private posterCandidates(entity:Entity):ArtworkSources {
    const files=(property:string,explicitPoster:boolean)=>values(entity,property).filter((file):file is string=>typeof file==='string').slice(0,2).map(file=>({file,explicitPoster}));
    return {files:[...files('P3383',true),...files('P18',false)],article:this.wikipediaPreview?entity.sitelinks?.enwiki?.title:undefined};
  }
  private async attachPosters(candidates:Map<string,ArtworkSources>,movies:WikidataMovie[],unavailable?:ArtworkFailures):Promise<WikidataMovie[]> {
    let posters=new Map<string,PosterCredit>();
    try{posters=await this.posters.resolve([...candidates.values()].flatMap(value=>value.files),{throwOnError:true});}
    catch{if(unavailable)unavailable.commons=true;}
    const decorated=movies.map(movie=>{const poster=candidates.get(movie.wikidataId)?.files.map(candidate=>posters.get(candidate.file)).find(Boolean);return poster?{...movie,posterUrl:poster.url,posterCredit:poster}:movie;});
    if(!this.wikipediaPreview)return decorated;
    const missing=decorated.flatMap(movie=>{const title=candidates.get(movie.wikidataId)?.article;return !movie.posterUrl&&title?[{wikidataId:movie.wikidataId,title}]:[];});
    let thumbnails=new Map<string,PosterCredit>();
    try{thumbnails=await this.wikipedia.resolve(missing,{throwOnError:true});}
    catch{if(unavailable)unavailable.wikipedia=true;}
    return decorated.map(movie=>{const poster=thumbnails.get(movie.wikidataId);return poster?{...movie,posterUrl:poster.url,posterCredit:poster}:movie;});
  }
  private async request(url: URL): Promise<unknown> {
    if (Date.now() < this.blockedUntil) throw new TmdbError('RATE_LIMITED');
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_,reject) => { timer=setTimeout(()=>{abort.abort();reject(new TmdbError('TIMEOUT'));},20000); });
    try {
      return await Promise.race([timeout,(async()=>{
        const response=await this.fetcher(url,{headers:{'User-Agent':'TalaramaLocal/0.1 (https://github.com/jlescarlan11/talarama)','Accept':'application/json'},redirect:'error',cache:'no-store',signal:abort.signal});
        if(response.status===429){ const seconds=Number(response.headers.get('retry-after'));this.blockedUntil=Date.now()+Math.max(60,Math.min(3600,Number.isFinite(seconds)?seconds:60))*1000;throw new TmdbError('RATE_LIMITED'); }
        if(!response.ok || response.redirected) throw new TmdbError('UNAVAILABLE');
        if(Number(response.headers.get('content-length'))>8*1024*1024){abort.abort();void response.body?.cancel().catch(()=>{});throw new OversizedWikidataResponse();}
        const reader=response.body?.getReader(); if(!reader) throw new TmdbError('INVALID_RESPONSE');
        const chunks:Uint8Array[]=[];let size=0;let complete=false;
        try{for(;;){const {done,value}=await reader.read();if(done){complete=true;break;}size+=value.byteLength;if(size>8*1024*1024)throw new OversizedWikidataResponse();chunks.push(value);}}
        finally{
          // Next may tee the response. Cancelling one branch can wait forever
          // for an unread sibling: abort the transport and split without waiting.
          if(!complete)abort.abort();void reader.cancel().catch(()=>{});
        }
        const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
        try { const result=JSON.parse(new TextDecoder().decode(body));if(result.error)throw new Error();return result; } catch {throw new TmdbError('INVALID_RESPONSE');}
      })()]);
    } catch(error) { if(error instanceof TmdbError)throw error;throw new TmdbError('UNAVAILABLE'); }
    finally { clearTimeout(timer!); }
  }
  private api(params: Record<string,string>) { const url=new URL('https://www.wikidata.org/w/api.php');url.search=new URLSearchParams({format:'json',...params}).toString();return this.request(url); }
  private async entities(requested: string[], claims = true): Promise<Entity[]> {
    if(!requested.length)return [];
    let raw:unknown;
    try{raw=await this.api({action:'wbgetentities',ids:requested.join('|'),languages:'en',props:claims?'labels|descriptions|claims'+(this.wikipediaPreview?'|sitelinks':''):'labels',sitefilter:'enwiki'});}
    catch(error){
      if(!(error instanceof OversizedWikidataResponse)||requested.length<2)throw error;
      const middle=Math.ceil(requested.length/2);
      // Split sequentially so the caller's two-request concurrency ceiling still holds.
      return [...await this.entities(requested.slice(0,middle),claims),...await this.entities(requested.slice(middle),claims)];
    }
    const data=z.object({entities:z.record(z.unknown())}).safeParse(raw);
    if(!data.success)throw new TmdbError('INVALID_RESPONSE');
    return requested.map(id=>{ const raw=data.data.entities[id];if(raw && typeof raw==='object' && 'missing' in raw)throw new TmdbError('NOT_FOUND');const parsed=entitySchema.safeParse(raw);if(!parsed.success || parsed.data.id!==id)throw new TmdbError('INVALID_RESPONSE');return parsed.data; });
  }
  async details(id: string): Promise<WikidataMovie & {artworkUnavailable?:ArtworkFailures}> {
    if(!wikidataIdSchema.safeParse(id).success)throw new TmdbError('INVALID_INPUT');
    let metadata:DiscoveryMetadata;let stale=false;
    try{
      const retry=this.detailRetries.get(id);if(retry&&Date.now()<retry.until)throw retry.error;
      metadata=await this.cache.get(`details:${id}`,3600000,async()=>{
        let entity:Entity;
        try{[entity]=await this.entities([id]);validFilm(entity);}catch(error){
          if(error instanceof TmdbError&&['NOT_FOUND','CONTENT_BLOCKED'].includes(error.code))await this.persistence?.discardDetail(id);
          throw error;
        }
        const related=[...new Set([...ids(entity,'P136').slice(0,10),...ids(entity,'P57').slice(0,10),...ids(entity,'P161').slice(0,20)])];
        const labels=new Map((await this.entities(related,false)).map(row=>[row.id,row.labels.en?.value || row.id]));
        const value={movies:[normalize(entity,labels)],candidates:new Map([[id,this.posterCandidates(entity)]])};
        await this.persistence?.saveDetail(value);return value;
      });
      this.detailRetries.delete(id);
    }catch(error){
      if(!this.persistence||!(error instanceof TmdbError)||!['UNAVAILABLE','TIMEOUT','RATE_LIMITED'].includes(error.code))throw error;
      const cached=await this.persistence.cachedDetail(id);if(!cached)throw error;
      metadata=cached;stale=true;
      if((this.detailRetries.get(id)?.until??0)<=Date.now()){
        this.detailRetries.delete(id);while(this.detailRetries.size>=512)this.detailRetries.delete(this.detailRetries.keys().next().value!);
        this.detailRetries.set(id,{until:Date.now()+60000,error});
      }
    }
    const unavailable:ArtworkFailures={};
    const movie=(await this.attachPosters(metadata.candidates,metadata.movies,unavailable))[0];
    return {...movie,...(stale?{stale:true as const}:{}),...(Object.keys(unavailable).length?{artworkUnavailable:unavailable}:{})};
  }
  search(input: { query:string;year?:number;page?:number }) { return this.list(input); }
  discover(input: { genre?:number;year?:number;page?:number } = {}) {
    return input.genre===undefined && input.year===undefined ? this.discovery(input.page??1) : this.list(input);
  }
  private async discovery(page:number):Promise<CatalogPage<WikidataMovie>>{
    if(!Number.isInteger(page)||page<1||page>500)throw new TmdbError('INVALID_INPUT');
    if(!this.persistence)return this.recent(page);
    try{
      if(Date.now()<this.discoveryRetryAt&&this.discoveryError)throw this.discoveryError;
      const data=await this.recent(page);
      await this.persistence.savePage(data);this.lastDiscoveryPages.set(page,data);
      this.discoveryRetryAt=0;this.discoveryError=undefined;return data;
    }catch(error){
      if(!(error instanceof TmdbError)||!['UNAVAILABLE','TIMEOUT','RATE_LIMITED'].includes(error.code))throw error;
      if(!(error instanceof DiscoveryWorkLimit)&&Date.now()>=this.discoveryRetryAt){this.discoveryRetryAt=Date.now()+60000;this.discoveryError=error;}
      const cached=await this.persistence.cachedPage(page);if(!cached)throw error;
      const failures:ArtworkFailures={};
      const decorated=await this.attachPosters(cached.candidates,cached.data.results,failures);
      const previous=new Map(this.lastDiscoveryPages.get(page)?.results.map(movie=>[movie.wikidataId,movie]));
      const results=decorated.map(movie=>{
        const old=previous.get(movie.wikidataId);
        const retain=old&&!movie.posterUrl&&((failures.commons&&isCommonsPosterUrl(old.posterUrl))||(failures.wikipedia&&isWikipediaPreviewPosterUrl(old.posterUrl)));
        return retain?{...movie,posterUrl:old.posterUrl,posterCredit:old.posterCredit}:movie;
      });
      return {...cached.data,results};
    }
  }
  /** A bounded live selection, not an exhaustive release calendar or popularity chart.
   * Filter artwork before pagination so every default card has a verified poster.
   * No imports or member reads occur here. Explicit filters retain the full catalog.
   */
  private async recent(page:number):Promise<CatalogPage<WikidataMovie>> {
    if(!Number.isInteger(page)||page<1||page>500)throw new TmdbError('INVALID_INPUT');
    const now=new Date(),year=now.getUTCFullYear(),day=now.toISOString().slice(0,10);
    const tomorrow=new Date(Date.UTC(year,now.getUTCMonth(),now.getUTCDate()+1)).toISOString();
    const available:WikidataMovie[]=[];
    const selections:PosterSelection[]=[];
    const seen=new Set<string>();
    const budget={remaining:4};
    // Give each year its own coverage-ranked pool. A previous year's hit must
    // not crowd a newly catalogued current-year film out of the shared limit.
    // Older years are loaded only when this page (or its lookahead) needs them.
    for(let releaseYear=year;releaseYear>=year-2&&available.length<=page*12;releaseYear--){
      let cursor:RecentCursor|null=null;
      do{
        const selection=await this.recentSelection(day,releaseYear,releaseYear===year?tomorrow:`${releaseYear+1}-01-01T00:00:00Z`,cursor,budget);
        selections.push(selection);
        await this.appendPosters(selection,available,page*12,seen);
        for(const movie of selection.metadata.movies)seen.add(movie.wikidataId);
        cursor=selection.nextCursor;
      }while(cursor&&available.length<=page*12);
    }
    let offset:number|null=0;
    while(available.length<=page*12&&offset!==null){
      const older=await this.olderSelection(day,year,offset,budget);
      selections.push(older);
      await this.appendPosters(older,available,page*12,seen);
      for(const movie of older.metadata.movies)seen.add(movie.wikidataId);
      offset=older.nextOffset;
    }
    // An artwork outage must be retryable, not cached as a successful empty catalog.
    if(selections.some(value=>value.metadata.movies.length)&&!available.length){for(const value of selections)value.batches.clear();throw new TmdbError('UNAVAILABLE');}
    const hasMore=page<500&&available.length>page*12;
    const total=hasMore?page*12+1:Math.min(available.length,page*12);
    return {source:'wikidata',order:'recent',page,hasMore,totalResults:total,totalPages:Math.ceil(total/12),results:available.slice((page-1)*12,page*12)};
  }

  private recentSelection(day:string,year:number,before:string,cursor:RecentCursor|null,budget:{remaining:number}):Promise<RecentSelection> {
    const key=`${day}:${year}:${cursor?`${cursor.links}:${cursor.id}`:'start'}`;
    return this.discoveryCache.get(`recent-posters:${key}`,300000,async()=>{
      const loaded=await this.cachedDiscovery(`recent-metadata:${key}`,async()=>{
        // Only fresh continuation reads consume this request's budget. Cached
        // progress survives a retry; a cold deep link cannot scan indefinitely.
        if(cursor&&budget.remaining--<=0)throw new DiscoveryWorkLimit();
        const limit=cursor?48:240;
        const after=cursor?` FILTER(?links < ${cursor.links} || (?links = ${cursor.links} && STR(?film) > "http://www.wikidata.org/entity/${cursor.id}"))`:'';
        const q=`PREFIX wdt:<http://www.wikidata.org/prop/direct/> PREFIX wd:<http://www.wikidata.org/entity/> PREFIX hint:<http://www.bigdata.com/queryHints#> PREFIX wikibase:<http://wikiba.se/ontology#> SELECT DISTINCT ?film ?links WHERE { ?film wdt:P31 wd:Q11424; wdt:P577 ?date. FILTER(?date >= "${year}-01-01T00:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> && ?date < "${before}"^^<http://www.w3.org/2001/XMLSchema#dateTime>) hint:Prior hint:rangeSafe true. ?film wikibase:sitelinks ?links. FILTER(?links >= 1)${after} } ORDER BY DESC(?links) ?film LIMIT ${limit}`;
        const url=new URL('https://query.wikidata.org/sparql');url.search=new URLSearchParams({query:q,format:'json'}).toString();
        const data=z.object({results:z.object({bindings:z.array(z.object({film:z.object({value:z.string().regex(/^http:\/\/www\.wikidata\.org\/entity\/Q[1-9]\d{0,11}$/)}),links:z.object({value:z.string().regex(/^[1-9]\d{0,6}$/)})})).max(limit)})}).safeParse(await this.request(url));
        if(!data.success)throw new TmdbError('INVALID_RESPONSE');
        let last=cursor;
        for(const row of data.data.results.bindings){
          const next={links:Number(row.links.value),id:row.film.value.split('/').at(-1)!};
          if(last&&(next.links>last.links||(next.links===last.links&&next.id<=last.id)))throw new TmdbError('INVALID_RESPONSE');
          last=next;
        }
        const selected=[...new Set(data.data.results.bindings.map(row=>row.film.value.split('/').at(-1)!))];
        // First release year excludes regional re-releases and cross-year duplicates.
        const metadata=await this.discoveryMetadata(selected,movie=>movie.releasedYear===year);
        return {metadata,nextCursor:data.data.results.bindings.length===limit?last:null};
      });
      return {...loaded,batches:new Map<number,Promise<WikidataMovie[]>>()};
    });
  }

  private async discoveryMetadata(selected:string[],eligible:(movie:WikidataMovie)=>boolean):Promise<DiscoveryMetadata> {
    const unique=[...new Set(selected)];const rows:Entity[]=[];
    for(let offset=0;offset<unique.length;offset+=100)rows.push(...(await Promise.all([this.entities(unique.slice(offset,offset+50)),this.entities(unique.slice(offset+50,offset+100))])).flat());
    const movies=rows.flatMap(row=>{try{const movie=normalize(row);return row.labels.en?.value&&eligible(movie)?[movie]:[];}catch(error){if(error instanceof TmdbError&&error.code==='CONTENT_BLOCKED')return [];throw error;}});
    movies.sort((a,b)=>b.releasedYear!-a.releasedYear!||a.wikidataId.localeCompare(b.wikidataId,'en',{numeric:true}));
    return {movies,candidates:new Map(rows.map(row=>[row.id,this.posterCandidates(row)]))};
  }
  private olderSelection(day:string,year:number,offset=0,budget={remaining:4}):Promise<OlderSelection> {
    return this.discoveryCache.get(`older-posters:${day}:${offset}`,300000,async()=>{
      const loaded=await this.cachedDiscovery(`older-metadata:${day}:${offset}`,async()=>{
        // Preserve the opening classics selection, then fetch small continuation batches.
        // A cold deep-page jump can retry; it cannot trigger unbounded upstream work.
        if(offset>0&&budget.remaining--<=0)throw new DiscoveryWorkLimit();
        const limit=Math.min(offset===0?240:48,10000-offset);
        const data=z.object({continue:z.object({sroffset:z.number().int().min(1).max(10000)}).optional(),query:z.object({search:z.array(z.object({title:wikidataIdSchema})).max(limit)})}).safeParse(await this.api({action:'query',list:'search',srsearch:'haswbstatement:P31=Q11424 haslabel:en',srsort:'incoming_links_desc',srlimit:String(limit),sroffset:String(offset),srinfo:'',srprop:''}));
        if(!data.success)throw new TmdbError('INVALID_RESPONSE');
        const next=data.data.continue?.sroffset;
        if(next!==undefined&&(next<=offset||next>offset+limit))throw new TmdbError('INVALID_RESPONSE');
        const metadata=await this.discoveryMetadata(data.data.query.search.map(row=>row.title),movie=>movie.releasedYear!==null&&movie.releasedYear<year-2);
        return {metadata,nextOffset:next===undefined||next===10000?null:next};
      });
      return {...loaded,batches:new Map<number,Promise<WikidataMovie[]>>()};
    });
  }

  private async appendPosters(selection:PosterSelection,available:WikidataMovie[],target:number,exclude?:Set<string>) {
    const {metadata,batches}=selection;
    // Resolve only enough ordered candidates for this page and one verified lookahead.
    // Cached batch promises coalesce concurrent pages without mutating a shared cursor.
    for(let offset=0;offset<metadata.movies.length&&available.length<=target;offset+=12){
      let pending=batches.get(offset);
      if(!pending){
        const batch=metadata.movies.slice(offset,offset+12);
        pending=this.attachPosters(new Map(batch.map(movie=>[movie.wikidataId,metadata.candidates.get(movie.wikidataId)!])),batch)
          .then(movies=>movies.filter(movie=>!!movie.posterUrl))
          .catch(error=>{batches.delete(offset);throw error;});
        batches.set(offset,pending);
      }
      available.push(...(await pending).filter(movie=>!exclude?.has(movie.wikidataId)));
    }
  }

  private async list(input: { query?:string;genre?:number;year?:number;page?:number }): Promise<CatalogPage<WikidataMovie>> {
    const parsed=z.object({query:z.string().trim().min(1).max(200).optional(),genre:z.number().int().refine(id=>!!wikiGenres[id]).optional(),year:z.number().int().min(1800).max(9999).optional(),page:z.number().int().min(1).max(500).default(1)}).safeParse(input);
    if(!parsed.success)throw new TmdbError('INVALID_INPUT');const {query,genre,year,page}=parsed.data;
    // Stable field order, explicit defaults, and a digest keep query text out of the disk index.
    const key=`list:${createHash('sha256').update(JSON.stringify([query??null,genre??null,year??null,page])).digest('hex')}`;
    type ListMetadata={data:CatalogPage<WikidataMovie>;candidates:Map<string,ArtworkSources>};
    let metadata:ListMetadata;
    try{
     const retry=this.listRetries.get(key);if(retry&&Date.now()<retry.until)throw retry.error;
     metadata=await this.cache.get<ListMetadata>(key,query?300000:3600000,async()=>{
      const load=async():Promise<ListMetadata>=>{
      let selected:string[];let total=0;let hasMore:boolean|undefined;
      if(year){
        // Candidate restriction keeps title/year queries away from a global label scan.
        // Year search deliberately covers the first 100 title matches (disclosed in the UI).
        let constraint=genre?`?film wdt:${[16,10770].includes(genre)?'P31':'P136'} wd:${wikiGenres[genre]}.`:'?film wdt:P31 wd:Q11424.';
        if(query){
          const candidates=z.object({query:z.object({search:z.array(z.object({title:wikidataIdSchema})).max(100)})}).safeParse(await this.api({action:'query',list:'search',srsearch:`haswbstatement:${[...filmTypes].map(id=>`P31=${id}`).join('|')} haslabel:en inlabel:${JSON.stringify(query+'@en')}`,srsort:'incoming_links_desc',srlimit:'100',srinfo:'',srprop:''}));
          if(!candidates.success)throw new TmdbError('INVALID_RESPONSE');
          if(!candidates.data.query.search.length)return {data:{source:'wikidata',order:'identifier',page,totalPages:0,totalResults:0,results:[],hasMore:false},candidates:new Map()};
          constraint=`VALUES ?film { ${candidates.data.query.search.map(row=>`wd:${row.title}`).join(' ')} }`;
        }
        const q=`PREFIX wdt:<http://www.wikidata.org/prop/direct/> PREFIX wd:<http://www.wikidata.org/entity/> PREFIX hint:<http://www.bigdata.com/queryHints#> SELECT DISTINCT ?film WHERE { ${constraint} ?film wdt:P577 ?date. FILTER(?date >= "${year}-01-01T00:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> && ?date < "${year+1}-01-01T00:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime>) hint:Prior hint:rangeSafe true. } ORDER BY ?film LIMIT 13 OFFSET ${(page-1)*12}`;
        const url=new URL('https://query.wikidata.org/sparql');url.search=new URLSearchParams({query:q,format:'json'}).toString();
        const data=z.object({results:z.object({bindings:z.array(z.object({film:z.object({value:z.string().regex(/^http:\/\/www\.wikidata\.org\/entity\/Q[1-9]\d{0,11}$/)})})).max(13)})}).safeParse(await this.request(url));
        if(!data.success)throw new TmdbError('INVALID_RESPONSE');selected=data.data.results.bindings.map(row=>row.film.value.split('/').at(-1)!);hasMore=selected.length>12;selected=selected.slice(0,12);total=(page-1)*12+selected.length+(hasMore?1:0);
      }else{
        const literal=query?` inlabel:${JSON.stringify(query+'@en')}`:'';
        const filter=genre?` haswbstatement:P136=${wikiGenres[genre]}|P31=${wikiGenres[genre]}`:'';
        const data=z.object({query:z.object({searchinfo:z.object({totalhits:z.number().int().nonnegative()}),search:z.array(z.object({title:wikidataIdSchema})).max(12)})}).safeParse(await this.api({action:'query',list:'search',srsearch:`haswbstatement:${[...filmTypes].map(id=>`P31=${id}`).join('|')} haslabel:en${filter}${literal}`,srsort:'incoming_links_desc',srlimit:'12',sroffset:String((page-1)*12),srinfo:'totalhits',srprop:''}));
        if(!data.success)throw new TmdbError('INVALID_RESPONSE');selected=data.data.query.search.map(row=>row.title);total=data.data.query.searchinfo.totalhits;
      }
      const rows=await this.entities([...new Set(selected)]);
      const results=rows.flatMap(row=>{try{if(year && years(row)[0]!==year)return [];return [normalize(row)];}catch(error){if(error instanceof TmdbError && error.code==='CONTENT_BLOCKED')return [];throw error;}});
      return {data:{source:'wikidata',order:year?'identifier':'coverage',page,totalPages:Math.min(500,Math.ceil(total/12)),totalResults:total,results,...(hasMore===undefined?{}:{hasMore})},candidates:new Map(rows.filter(row=>results.some(movie=>movie.wikidataId===row.id)).map(row=>[row.id,this.posterCandidates(row)]))};
      };
      const fresh=await load();await this.persistence?.saveList(key,fresh);return fresh;
     });
     this.listRetries.delete(key);
    }catch(error){
     if(!this.persistence||!(error instanceof TmdbError)||!['UNAVAILABLE','TIMEOUT','RATE_LIMITED'].includes(error.code))throw error;
     if(!this.listRetries.has(key)||Date.now()>=this.listRetries.get(key)!.until){
      this.listRetries.delete(key);
      while(this.listRetries.size>=512)this.listRetries.delete(this.listRetries.keys().next().value!);
      this.listRetries.set(key,{until:Date.now()+60000,error});
     }
     const cached=await this.persistence.cachedList(key);if(!cached)throw error;metadata=cached;
    }
    const failures:ArtworkFailures={};
    const decorated=await this.attachPosters(metadata.candidates,metadata.data.results,failures);
    const previous=new Map(this.lastListPages.get(key)?.results.map(movie=>[movie.wikidataId,movie]));
    const results=decorated.map(movie=>{
     const old=previous.get(movie.wikidataId);
     const retain=old&&!movie.posterUrl&&((failures.commons&&isCommonsPosterUrl(old.posterUrl))||(failures.wikipedia&&isWikipediaPreviewPosterUrl(old.posterUrl)));
     return retain?{...movie,posterUrl:old.posterUrl,posterCredit:old.posterCredit}:movie;
    });
    const data={...metadata.data,results};
    if(this.persistence){
     this.lastListPages.delete(key);
     while(this.lastListPages.size>=200)this.lastListPages.delete(this.lastListPages.keys().next().value!);
     this.lastListPages.set(key,data);
    }
    return data;
  }
}

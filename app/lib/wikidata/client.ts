import 'server-only';
import { z } from 'zod';
import { MetadataCache } from '@/app/lib/tmdb/cache';
import { TmdbError } from '@/app/lib/tmdb/client';
import type { CatalogPage, WikidataMovie } from '@/app/lib/tmdb/types';
import { genres } from '@/app/lib/movies/catalog-query';
import {CommonsPosters,type PosterCandidate} from './commons-posters';
import {WikipediaPosters,localWikipediaPostersEnabled} from './wikipedia-posters';

export const wikidataIdSchema = z.string().regex(/^Q[1-9]\d{0,11}$/);
export const wikiGenres: Record<number, string> = { 28:'Q188473',12:'Q319221',16:'Q202866',35:'Q157443',80:'Q959790',99:'Q93204',18:'Q130232',10751:'Q1361932',14:'Q157394',36:'Q17013749',27:'Q200092',10402:'Q842256',9648:'Q1200678',10749:'Q1054574',878:'Q471839',10770:'Q506240',53:'Q2484376',10752:'Q369747',37:'Q172980' };
const filmTypes = new Set(['Q11424','Q24869','Q24862',...Object.values(wikiGenres)]);
const statement = z.object({ rank: z.string().optional(), mainsnak: z.object({ datavalue: z.object({ value: z.unknown() }).optional() }) });
const entitySchema = z.object({ id: wikidataIdSchema, labels: z.record(z.object({ value: z.string().max(500) })).default({}), descriptions: z.record(z.object({ value: z.string().max(3000) })).default({}), claims: z.record(z.array(statement).max(2000)).default({}),sitelinks:z.object({enwiki:z.object({title:z.string().max(240)}).optional()}).optional().catch(undefined) });
type Entity = z.infer<typeof entitySchema>;
type ArtworkSources={files:PosterCandidate[];article?:string};
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
  private blockedUntil = 0;
  private fetcher: typeof fetch;
  private posters:CommonsPosters;
  private wikipedia:WikipediaPosters;
  private wikipediaPreview:boolean;
  constructor({ fetcher = fetch,wikipediaPreview=localWikipediaPostersEnabled() }: { fetcher?: typeof fetch;wikipediaPreview?:boolean } = {}) { this.fetcher=fetcher;this.posters=new CommonsPosters({fetcher});this.wikipedia=new WikipediaPosters({fetcher});this.wikipediaPreview=wikipediaPreview; }
  private posterCandidates(entity:Entity):ArtworkSources {
    const files=(property:string,explicitPoster:boolean)=>values(entity,property).filter((file):file is string=>typeof file==='string').slice(0,2).map(file=>({file,explicitPoster}));
    return {files:[...files('P3383',true),...files('P18',false)],article:this.wikipediaPreview?entity.sitelinks?.enwiki?.title:undefined};
  }
  private async attachPosters(candidates:Map<string,ArtworkSources>,movies:WikidataMovie[]):Promise<WikidataMovie[]> {
    const posters=await this.posters.resolve([...candidates.values()].flatMap(value=>value.files));
    const decorated=movies.map(movie=>{const poster=candidates.get(movie.wikidataId)?.files.map(candidate=>posters.get(candidate.file)).find(Boolean);return poster?{...movie,posterUrl:poster.url,posterCredit:poster}:movie;});
    if(!this.wikipediaPreview)return decorated;
    const missing=decorated.flatMap(movie=>{const title=candidates.get(movie.wikidataId)?.article;return !movie.posterUrl&&title?[{wikidataId:movie.wikidataId,title}]:[];});
    const thumbnails=await this.wikipedia.resolve(missing);
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
        if(Number(response.headers.get('content-length'))>8*1024*1024) throw new TmdbError('INVALID_RESPONSE');
        const reader=response.body?.getReader(); if(!reader) throw new TmdbError('INVALID_RESPONSE');
        const chunks:Uint8Array[]=[];let size=0;
        try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>8*1024*1024)throw new TmdbError('INVALID_RESPONSE');chunks.push(value);}}finally{await reader.cancel().catch(()=>{});}
        const body=new Uint8Array(size);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length;}
        try { const result=JSON.parse(new TextDecoder().decode(body));if(result.error)throw new Error();return result; } catch {throw new TmdbError('INVALID_RESPONSE');}
      })()]);
    } catch(error) { if(error instanceof TmdbError)throw error;throw new TmdbError('UNAVAILABLE'); }
    finally { clearTimeout(timer!); }
  }
  private api(params: Record<string,string>) { const url=new URL('https://www.wikidata.org/w/api.php');url.search=new URLSearchParams({format:'json',...params}).toString();return this.request(url); }
  private async entities(requested: string[], claims = true): Promise<Entity[]> {
    if(!requested.length)return [];
    const data=z.object({entities:z.record(z.unknown())}).safeParse(await this.api({action:'wbgetentities',ids:requested.join('|'),languages:'en',props:claims?'labels|descriptions|claims'+(this.wikipediaPreview?'|sitelinks':''):'labels',sitefilter:'enwiki'}));
    if(!data.success)throw new TmdbError('INVALID_RESPONSE');
    return requested.map(id=>{ const raw=data.data.entities[id];if(raw && typeof raw==='object' && 'missing' in raw)throw new TmdbError('NOT_FOUND');const parsed=entitySchema.safeParse(raw);if(!parsed.success || parsed.data.id!==id)throw new TmdbError('INVALID_RESPONSE');return parsed.data; });
  }
  async details(id: string): Promise<WikidataMovie> {
    if(!wikidataIdSchema.safeParse(id).success)throw new TmdbError('INVALID_INPUT');
    const metadata=await this.cache.get(`details:${id}`,86400000,async()=>{
      const [entity]=await this.entities([id]); validFilm(entity);
      const related=[...new Set([...ids(entity,'P136').slice(0,10),...ids(entity,'P57').slice(0,10),...ids(entity,'P161').slice(0,20)])];
      const labels=new Map((await this.entities(related,false)).map(row=>[row.id,row.labels.en?.value || row.id]));
      return {movie:normalize(entity,labels),candidates:this.posterCandidates(entity)};
    });
    return (await this.attachPosters(new Map([[id,metadata.candidates]]),[metadata.movie]))[0];
  }
  search(input: { query:string;year?:number;page?:number }) { return this.list(input); }
  discover(input: { genre?:number;year?:number;page?:number } = {}) {
    return input.genre===undefined && input.year===undefined ? this.recent(input.page??1) : this.list(input);
  }
  /** A bounded live selection, not an exhaustive release calendar or popularity chart.
   * Filter artwork before pagination so every default card has a verified poster.
   * No imports or member reads occur here. Explicit filters retain the full catalog.
   */
  private async recent(page:number):Promise<CatalogPage<WikidataMovie>> {
    if(!Number.isInteger(page)||page<1||page>500)throw new TmdbError('INVALID_INPUT');
    const now=new Date(),year=now.getUTCFullYear(),day=now.toISOString().slice(0,10);
    const tomorrow=new Date(Date.UTC(year,now.getUTCMonth(),now.getUTCDate()+1)).toISOString();
    const results=await this.cache.get(`recent-posters:${day}`,300000,async()=>{
      const metadata=await this.cache.get(`recent-metadata:${day}`,3600000,async()=>{
        // Rank a small candidate pool by language coverage, then order eligible films
        // by first release year locally. Normalize excludes older regional re-releases.
        const q=`PREFIX wdt:<http://www.wikidata.org/prop/direct/> PREFIX wd:<http://www.wikidata.org/entity/> PREFIX hint:<http://www.bigdata.com/queryHints#> PREFIX wikibase:<http://wikiba.se/ontology#> SELECT DISTINCT ?film ?links WHERE { ?film wdt:P31 wd:Q11424; wdt:P577 ?date. FILTER(?date >= "${year-2}-01-01T00:00:00Z"^^<http://www.w3.org/2001/XMLSchema#dateTime> && ?date < "${tomorrow}"^^<http://www.w3.org/2001/XMLSchema#dateTime>) hint:Prior hint:rangeSafe true. ?film wikibase:sitelinks ?links. FILTER(?links >= 30) } ORDER BY DESC(?links) ?film LIMIT 60`;
        const url=new URL('https://query.wikidata.org/sparql');url.search=new URLSearchParams({query:q,format:'json'}).toString();
        const data=z.object({results:z.object({bindings:z.array(z.object({film:z.object({value:z.string().regex(/^http:\/\/www\.wikidata\.org\/entity\/Q[1-9]\d{0,11}$/)})})).max(60)})}).safeParse(await this.request(url));
        if(!data.success)throw new TmdbError('INVALID_RESPONSE');
        const selected=[...new Set(data.data.results.bindings.map(row=>row.film.value.split('/').at(-1)!))];
        const rows=(await Promise.all([this.entities(selected.slice(0,50)),this.entities(selected.slice(50))])).flat();
        const movies=rows.flatMap(row=>{try{const movie=normalize(row);return movie.releasedYear!==null&&movie.releasedYear>=year-2&&movie.releasedYear<=year?[movie]:[];}catch(error){if(error instanceof TmdbError&&error.code==='CONTENT_BLOCKED')return [];throw error;}});
        return {movies,candidates:new Map(rows.map(row=>[row.id,this.posterCandidates(row)]))};
      });
      const decorated:WikidataMovie[]=[];
      // Each artwork request stays within the existing 12-film / 48-file bound.
      for(let offset=0;offset<metadata.movies.length;offset+=12){
        const batch=metadata.movies.slice(offset,offset+12);
        decorated.push(...await this.attachPosters(new Map(batch.map(movie=>[movie.wikidataId,metadata.candidates.get(movie.wikidataId)!])),batch));
      }
      const available=decorated.filter(movie=>!!movie.posterUrl).sort((a,b)=>b.releasedYear!-a.releasedYear!||a.wikidataId.localeCompare(b.wikidataId,'en',{numeric:true}));
      // An artwork outage must be retryable, not cached as a successful empty catalog.
      if(metadata.movies.length&&!available.length)throw new TmdbError('UNAVAILABLE');
      return available;
    });
    return {source:'wikidata',order:'recent',page,totalResults:results.length,totalPages:Math.ceil(results.length/12),results:results.slice((page-1)*12,page*12)};
  }
  private async list(input: { query?:string;genre?:number;year?:number;page?:number }): Promise<CatalogPage> {
    const parsed=z.object({query:z.string().trim().min(1).max(200).optional(),genre:z.number().int().refine(id=>!!wikiGenres[id]).optional(),year:z.number().int().min(1800).max(9999).optional(),page:z.number().int().min(1).max(500).default(1)}).safeParse(input);
    if(!parsed.success)throw new TmdbError('INVALID_INPUT');const {query,genre,year,page}=parsed.data;
    const metadata=await this.cache.get<{data:CatalogPage<WikidataMovie>;candidates:Map<string,ArtworkSources>}>(`list:${JSON.stringify(parsed.data)}`,query?300000:3600000,async()=>{
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
    });
    return {...metadata.data,results:await this.attachPosters(metadata.candidates,metadata.data.results)};
  }
}

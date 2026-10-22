import type {WikidataMovie} from '@/app/lib/tmdb/types';
import {isCommonsPosterUrl,isWikipediaPreviewPosterUrl} from '@/app/lib/movies/poster-credit';

export const MOVIE_SYNC_TTL_MS=60*60*1000;
export type ArtworkFailures={commons?:true;wikipedia?:true};
const validId=(id:string)=>/^Q[1-9]\d{0,11}$/.test(id);
type RecordState={movie?:WikidataMovie;nextAttempt:number;pending?:Promise<WikidataMovie>;error?:unknown};

export function localMovieSyncEnabled(env:Record<string,string|undefined>=process.env){
 try{const url=new URL(env.NEXTAUTH_URL||'');return env.TALARAMA_MOVIE_SYNC!=='0'&&env.CATALOG_PROVIDER!=='tmdb'&&env.NEXT_PHASE!=='phase-production-build'&&!url.username&&!url.password&&(url.protocol==='https:'||(url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)));}catch{return false;}
}

/** Only public movie metadata lives here. All data is transient and bounded. */
export class WikidataSync {
 private records=new Map<string,RecordState>();
 private active=0;
 private waiting:(()=>void)[]=[];
 private stopWorker?:()=>void;
 constructor(private readonly load:(id:string)=>Promise<WikidataMovie & {artworkUnavailable?:ArtworkFailures}>,private readonly options:{ttlMs?:number;retryMs?:number;now?:()=>number;batchSize?:number;capacity?:number}={}){}
 private now(){return(this.options.now||Date.now)();}
 remember(ids:string[]){
  for(const id of ids){
   if(!validId(id)||this.records.has(id))continue;
   if(this.records.size>=(this.options.capacity??512)){
    const oldest=[...this.records].find(([,value])=>!value.pending)?.[0];
    if(!oldest)continue;this.records.delete(oldest);
   }
   this.records.set(id,{nextAttempt:0});
  }
 }
 peek(id:string){return this.records.get(id)?.movie;}
 async details(id:string):Promise<WikidataMovie>{
  if(!validId(id))throw Object.assign(Error('Invalid movie identifier'),{code:'INVALID_INPUT'});
  this.remember([id]);const state=this.records.get(id);
  if(!state)throw Error('Movie sync queue full');
  if(state.pending)return state.pending;
  if(state.nextAttempt>this.now()){
   if(state.movie)return state.movie;
   if(state.error)throw state.error;
  }
  state.pending=this.fetch(id,state).finally(()=>{state.pending=undefined;});
  return state.pending;
 }
 private async fetch(id:string,state:RecordState){
  if(this.active>=2)await new Promise<void>(resolve=>this.waiting.push(resolve));
  else this.active++;
  try{
   const {artworkUnavailable,...movie}=await this.load(id);
   if(movie.wikidataId!==id)throw Object.assign(Error('Mismatched movie'),{code:'INVALID_RESPONSE'});
   const previous=state.movie;
   const retain=previous&&!movie.posterUrl&&((artworkUnavailable?.commons&&isCommonsPosterUrl(previous.posterUrl))||(artworkUnavailable?.wikipedia&&isWikipediaPreviewPosterUrl(previous.posterUrl)));
   state.movie=retain?{...movie,posterUrl:previous.posterUrl,posterCredit:previous.posterCredit}:movie;
   state.error=undefined;state.nextAttempt=this.now()+((artworkUnavailable||movie.stale)?(this.options.retryMs??60000):(this.options.ttlMs??MOVIE_SYNC_TTL_MS));
   return state.movie;
  }catch(error){
   state.error=error;state.nextAttempt=this.now()+(this.options.retryMs??60000);
   const code=error&&typeof error==='object'&&'code'in error?error.code:undefined;
   if(code==='NOT_FOUND'||code==='CONTENT_BLOCKED')state.movie=undefined;
   if(state.movie)return state.movie;
   throw error;
  }finally{const next=this.waiting.shift();if(next)next();else this.active--;}
 }
 async refresh(ids:string[]=[]){
  this.remember(ids);
  const due=[...this.records].filter(([,state])=>!state.pending&&state.nextAttempt<=this.now()).sort((a,b)=>a[1].nextAttempt-b[1].nextAttempt).slice(0,this.options.batchSize??12);
  await Promise.allSettled(due.map(([id])=>this.details(id)));
 }
 /** A self-scheduling timer prevents overlapping sweeps; unref lets Node exit. */
 start(listIds:()=>Promise<string[]>,intervalMs=60000){
  if(this.stopWorker)return this.stopWorker;
  let stopped=false;let timer:ReturnType<typeof setTimeout>;
  const schedule=()=>{timer=setTimeout(async()=>{
   try{const ids=await listIds();if(!stopped)await this.refresh(ids);}catch{ /* Retry next tick; never affect server readiness. */ }
   if(!stopped)schedule();
  },intervalMs);timer.unref?.();};
  const stop=()=>{stopped=true;clearTimeout(timer);this.stopWorker=undefined;};
  this.stopWorker=stop;schedule();return stop;
 }
}

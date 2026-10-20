import 'server-only';
import prisma from '@/prisma/client';
import type {PrismaClient} from '@prisma/client';
import {movieSync,wikidata} from '@/app/lib/wikidata/server';
import {localMovieSyncEnabled,MOVIE_SYNC_TTL_MS,type WikidataSync} from '@/app/lib/wikidata/sync';

export async function syncEntryMovies<T extends {movie:{id:string;title:string;posterUrl:string|null;releasedYear:number|null}}>(entries:T[],{db=prisma}:{db?:PrismaClient}={}){
 const movies=await syncMovieDisplays(entries.map(entry=>entry.movie),{db});
 return entries.map((entry,index)=>({...entry,movie:movies[index]}));
}

/** Read-only overlay: local IDs, saved snapshots and member records never change. */
export async function syncMovieDisplays<T extends {id:string;title:string;posterUrl:string|null;releasedYear:number|null}>(movies:T[],{db=prisma,sync=movieSync,enabled=localMovieSyncEnabled()}:{db?:PrismaClient;sync?:WikidataSync;enabled?:boolean}={}):Promise<T[]>{
 if(!enabled||!movies.length)return movies;
 const identities=await db.externalMovieIdentity.findMany({where:{provider:'WIKIDATA',movieId:{in:[...new Set(movies.map(movie=>movie.id))]}},select:{movieId:true,externalId:true}});
 const ids=new Map(identities.map(identity=>[identity.movieId,identity.externalId]));
 sync.remember(identities.map(identity=>identity.externalId));
 // Warm asynchronously. A page can use the saved snapshot without waiting on Wikimedia.
 void sync.refresh().catch(()=>{});
 return movies.map(movie=>{
  const id=ids.get(movie.id),fresh=id?sync.peek(id):undefined;
  if(!fresh)return movie;
  const result={...movie,title:fresh.title,posterUrl:fresh.posterUrl,releasedYear:fresh.releasedYear};
  // Public cards select fewer columns; do not widen their response contracts.
  const fields={description:fresh.description,duration:fresh.duration,backdropUrl:fresh.backdropUrl,directorFirstName:fresh.directors[0]?.name??null,directorLastName:null};
  for(const [key,value] of Object.entries(fields))if(key in movie)Object.assign(result,{[key]:value});
  return result;
 });
}

/** Runs only in an explicitly enabled local preview; reads mappings, never member tables. */
export function startLocalMovieSync(){
 if(!localMovieSyncEnabled())return;
 let cursor:string|undefined;let nextDiscovery=0;
 const stop=movieSync.start(async()=>{
  const rows=await prisma.externalMovieIdentity.findMany({where:{provider:'WIKIDATA',...(cursor?{externalId:{gt:cursor}}:{})},select:{externalId:true},orderBy:{externalId:'asc'},take:12});
  cursor=rows.length===12?rows.at(-1)!.externalId:undefined;
  if(Date.now()>=nextDiscovery){
   try{await wikidata.discover();nextDiscovery=Date.now()+MOVIE_SYNC_TTL_MS;}catch{ /* Retry on the next bounded sweep. */ }
  }
  return rows.map(row=>row.externalId);
 });
 console.info('[movie-sync] Local background refresh enabled (hourly metadata, bounded minute sweeps).');
 return stop;
}

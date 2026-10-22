import 'server-only';
import prisma from '@/prisma/client';
import { z } from 'zod';
import { wikidata } from '@/app/lib/wikidata/server';
import { TmdbError } from '@/app/lib/tmdb/client';
import type { WikidataMovie } from '@/app/lib/tmdb/types';
import {posterCreditSchema} from '@/app/lib/movies/poster-credit';

export async function getWikidataMovieDetail(wikidataId:string,userId?:string) {
  const identity=await prisma.externalMovieIdentity.findUnique({where:{provider_externalId:{provider:'WIKIDATA',externalId:wikidataId}},include:{movie:{include:{genres:{include:{genre:true}}}}}});
  const local=identity?.movie;let movie:WikidataMovie;let providerUnavailable=false;
  try{movie=await wikidata.details(wikidataId);providerUnavailable=!!movie.stale;}catch(error){
    if(!local){if(error instanceof TmdbError && ['NOT_FOUND','CONTENT_BLOCKED'].includes(error.code))return null;throw error;}
    providerUnavailable=true;
    const person=z.object({wikidataId:z.string(),name:z.string(),character:z.string().default('')});
    const credits=z.object({cast:z.array(person),directors:z.array(person)}).safeParse(local.credits);
    const artwork=posterCreditSchema.safeParse(local.credits && typeof local.credits==='object' && !Array.isArray(local.credits)?local.credits.posterCredit:undefined);
    movie={localId:local.id,wikidataId,tmdbId:null,title:local.title,description:local.description,releasedYear:local.releasedYear,duration:local.duration,posterUrl:local.posterUrl,backdropUrl:local.backdropUrl,tmdbScore:null,tmdbVoteCount:null,genres:local.genres.map(({genre})=>({wikidataId:'',name:genre.genreName})),posterCredit:artwork.success && artwork.data.url===local.posterUrl?artwork.data:undefined,cast:credits.success?credits.data.cast:[],directors:credits.success?credits.data.directors:[]};
  }
  const [like,watch]=local && userId?await Promise.all([prisma.likedBy.findUnique({where:{movieId_userId:{movieId:local.id,userId}}}),prisma.watchlistEntry.findUnique({where:{movieId_userId:{movieId:local.id,userId}}})]):[null,null];
  return {movie,localId:local?.id??null,providerUnavailable,favorite:!!like,watchlist:!!watch,rating:{average:null,count:0}};
}

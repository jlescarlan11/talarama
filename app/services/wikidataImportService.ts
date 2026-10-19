import 'server-only';
import type { PrismaClient } from '@prisma/client';
import prisma from '@/prisma/client';
import { wikidata } from '@/app/lib/wikidata/server';
import { wikidataIdSchema } from '@/app/lib/wikidata/client';
import { catalogTransaction, movieMetadata } from './movieImportService';
import type { WikidataMovie } from '@/app/lib/tmdb/types';

/** Explicit signed-in intent only. Never merge/backfill existing movies by name. */
export async function importWikidataMovie(id:string,{db=prisma,provider=wikidata}:{db?:PrismaClient;provider?:{details(id:string):Promise<WikidataMovie>}}={}) {
  const externalId=wikidataIdSchema.parse(id);const where={provider_externalId:{provider:'WIKIDATA',externalId}};
  const existing=await db.externalMovieIdentity.findUnique({where,include:{movie:true}});if(existing)return existing.movie;
  const detail=await provider.details(externalId);
  if(detail.wikidataId!==externalId || detail.tmdbId!==null || detail.tmdbScore!==null)throw new Error('Provider identity mismatch');
  return catalogTransaction(db,async tx=>{
    const winner=await tx.externalMovieIdentity.findUnique({where,include:{movie:true}});if(winner)return winner.movie;
    const genreIds:string[]=[];
    for(const name of new Set(detail.genres.map(genre=>genre.name))){const genre=await tx.genre.upsert({where:{genreName:name},create:{genreName:name},update:{}});genreIds.push(genre.id);}
    return tx.movie.create({data:{...movieMetadata(detail),tmdbId:null,externalIdentities:{create:{provider:'WIKIDATA',externalId}},genres:{create:genreIds.map(genreId=>({genreId}))}}});
  });
}

import {Prisma} from '@prisma/client';
import prisma from '@/prisma/client';
import {communityRating} from '@/app/services/communityRatingService';
import {listPublicEntries} from '@/app/services/publicEntryService';
import {json,communityError} from '@/app/lib/community/http';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 try{const {id}=await params;const cursor=new URL(request.url).searchParams.get('cursor')??undefined;
  if(!await prisma.movie.findUnique({where:{id},select:{id:true}}))return json({error:'Not found'},404);
  return json(await prisma.$transaction(async tx=>({rating:await communityRating(id,{db:tx as typeof prisma}),...await listPublicEntries({movieId:id,textOnly:true,cursor},{db:tx as typeof prisma})}),{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead}));
 }catch(e){return communityError(e);}
}

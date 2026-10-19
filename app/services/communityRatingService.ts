import 'server-only';
import {Prisma,type PrismaClient} from '@prisma/client';
import prisma from '@/prisma/client';
import {publicEligibility} from './publicEntryService';
export async function communityRating(movieId:string,{db=prisma}:{db?:PrismaClient}={}){
 // Prisma distinct preserves the requested ordering; one newest eligible rated entry per member.
 const rows=await db.diaryEntry.findMany({where:{AND:[publicEligibility,{movieId,rating:{not:null}}]},select:{userId:true,rating:true},distinct:['userId'],orderBy:[{createdAt:'desc'},{id:'desc'}]});
 const count=rows.length;
 return {average:count?rows.reduce((sum,r)=>sum+r.rating!,0)/count:null,count};
}
export async function movieCommunity(movieId:string,options:{db?:PrismaClient}={}){
 const {listPublicEntries}=await import('./publicEntryService');
 const db=options.db??prisma;
 return db.$transaction(async tx=>({rating:await communityRating(movieId,{db:tx as PrismaClient}),...await listPublicEntries({movieId,textOnly:true},{db:tx as PrismaClient})}),{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead});
}

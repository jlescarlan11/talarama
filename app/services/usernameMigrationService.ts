import 'server-only';
import {z} from 'zod';
import type {PrismaClient} from '@prisma/client';
import {usernameSchema} from '@/app/lib/profiles/contracts';
export const usernameManifest=z.object({version:z.literal(1),reviewedBy:z.string().trim().min(1).max(200),mappings:z.array(z.object({id:z.string().min(1).max(200),original:z.string().nullable(),username:usernameSchema}).strict()).min(1).max(1000)}).strict().refine(v=>new Set(v.mappings.map(r=>r.id)).size===v.mappings.length && new Set(v.mappings.map(r=>r.username)).size===v.mappings.length,'Duplicate mapping');
export async function applyReviewedUsernames(value:unknown,{db}:{db:PrismaClient}){
 const manifest=usernameManifest.parse(value);
 return db.$transaction(async tx=>{
  for(const row of manifest.mappings){
   const user=await tx.user.findUnique({where:{id:row.id},select:{username:true}});
   if(!user || user.username!==row.original)throw Error('Stale or missing original username');
   const updated=await tx.user.updateMany({where:{id:row.id,username:row.original},data:{username:row.username}});
   if(updated.count!==1)throw Error('Username changed since preview');
  }
  return tx.usernameMappingAudit.create({data:{reviewer:manifest.reviewedBy,mappings:manifest.mappings}});
 });
}

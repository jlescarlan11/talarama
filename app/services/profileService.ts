import 'server-only';
import {randomBytes} from 'node:crypto';
import {Prisma, type PrismaClient} from '@prisma/client';
import prisma from '@/prisma/client';
import {profileSchema, usernameSchema} from '@/app/lib/profiles/contracts';
export class CommunityError extends Error {
 constructor(message:string, public status:number){super(message);}
}
export const ownerProfileSelect={username:true,name:true,bio:true,timeZone:true,profilePublished:true,showFavorites:true} satisfies Prisma.UserSelect;
export async function updateProfile(userId:string,input:unknown,{db=prisma}:{db?:PrismaClient}={}){
 const data=profileSchema.parse(input);
 try {return await db.user.update({where:{id:userId},data,select:ownerProfileSelect});}
 catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002')throw new CommunityError('That handle is already in use.',409);throw error;}
}
/** Account creation precedes allocation; no email-derived public identity is ever written. */
export async function allocateUsername(userId:string,{db=prisma,candidate=()=>`member_${randomBytes(6).toString('hex')}`}:{db?:PrismaClient;candidate?:(attempt:number)=>string}={}){
 const existing=await db.user.findUniqueOrThrow({where:{id:userId},select:{username:true}});
 if(existing.username)return existing.username;
 for(let attempt=0;attempt<20;attempt++){
  const username=usernameSchema.parse(candidate(attempt));
  try{
   await db.user.updateMany({where:{id:userId,username:null},data:{username}});
   return (await db.user.findUniqueOrThrow({where:{id:userId},select:{username:true}})).username!;
  }catch(error){if(!(error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002'))throw error;}
 }
 throw new CommunityError('Could not allocate a handle. Please retry sign-in.',503);
}

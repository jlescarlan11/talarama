import 'server-only';
import {z} from 'zod';
import {Prisma,type PrismaClient} from '@prisma/client';
import prisma from '@/prisma/client';
import {CommunityError} from './profileService';
import {publicEligibility} from './publicEntryService';
import {consumeMutation} from '@/app/lib/rateLimit';
export const reportSchema=z.object({reason:z.string().trim().min(1).max(500)}).strict();
export const moderationSchema=z.object({action:z.enum(['hide','unhide','resolve'])}).strict();
export async function requireAdmin(userId:string,db:Pick<PrismaClient,'user'>=prisma){
 if((await db.user.findUnique({where:{id:userId},select:{role:true}}))?.role!=='ADMIN')throw new CommunityError('Forbidden',403);
}
export async function reportEntry(reporterId:string,entryId:string,reason:unknown,{db=prisma}:{db?:PrismaClient}={}){
 const data=reportSchema.parse({reason});
 const eligible=await db.diaryEntry.findFirst({where:{AND:[publicEligibility,{id:entryId,review:{not:''}}]},select:{id:true}});
 if(!eligible)throw new CommunityError('Not found',404);
 const key={reporterId_entryId:{reporterId,entryId}};
 const existing=await db.entryReport.findUnique({where:key,select:{id:true}});if(existing)return existing;
 await consumeMutation(reporterId,'report',{db});
 try{return await db.entryReport.upsert({where:key,create:{...data,reporterId,entryId},update:{},select:{id:true}});}
 catch(error){if(error instanceof Prisma.PrismaClientKnownRequestError && error.code==='P2002'){const replay=await db.entryReport.findUnique({where:key,select:{id:true}});if(replay)return replay;}throw error;}
}
export async function listReports(adminId:string,{db=prisma,cursor}:{db?:PrismaClient;cursor?:string}={}){
 await requireAdmin(adminId,db);
 let where:Prisma.EntryReportWhereInput={};
 if(cursor){try{
  if(cursor.length>1000)throw Error();
  const row=JSON.parse(Buffer.from(cursor,'base64url').toString());
  if(typeof row.id!=='string'||!row.id||row.id.length>200||typeof row.date!=='string'||!Number.isFinite(new Date(row.date).getTime()))throw Error();
  const createdAt=new Date(row.date);where={OR:[{createdAt:{lt:createdAt}},{createdAt,id:{lt:row.id}}]};
 }catch{throw new CommunityError('Invalid cursor',400);}}
 const rows=await db.entryReport.findMany({where,select:{id:true,reason:true,createdAt:true,resolvedAt:true,entry:{select:{id:true,review:true,moderationState:true,movie:{select:{title:true}},user:{select:{username:true}}}}},orderBy:[{createdAt:'desc'},{id:'desc'}],take:101});
 const reports=rows.slice(0,100);const last=reports.at(-1);
 return {reports,nextCursor:rows.length>100&&last?Buffer.from(JSON.stringify({id:last.id,date:last.createdAt.toISOString()})).toString('base64url'):null};
}
export async function moderateReport(adminId:string,reportId:string,input:unknown,{db=prisma}:{db?:PrismaClient}={}){
 const {action}=moderationSchema.parse(input);
 return db.$transaction(async tx=>{
  await requireAdmin(adminId,tx as PrismaClient);
  const report=await tx.entryReport.findUnique({where:{id:reportId},select:{entryId:true}});if(!report)throw new CommunityError('Not found',404);
  if(action==='resolve')await tx.entryReport.update({where:{id:reportId},data:{resolvedAt:new Date()}});
  else await tx.diaryEntry.update({where:{id:report.entryId},data:{moderationState:action==='hide'?'HIDDEN':'VISIBLE'}});
  await tx.moderationAudit.create({data:{adminId,reportId,entryId:report.entryId,action}});
  return {ok:true};
 });
}

import 'server-only';
import {Prisma,type PrismaClient} from '@prisma/client';
import prisma from '@/prisma/client';
import {CommunityError} from './profileService';
import {syncEntryMovies,syncMovieDisplays} from './movieSyncService';
/** Sole public eligibility contract. Every public entry read and aggregate uses this predicate. */
export const publicEligibility={visibility:'PUBLIC',moderationState:'VISIBLE',user:{profilePublished:true}} satisfies Prisma.DiaryEntryWhereInput;
export const publicMemberSelect={username:true,name:true,image:true} satisfies Prisma.UserSelect;
const movieSelect={id:true,tmdbId:true,title:true,posterUrl:true,releasedYear:true} satisfies Prisma.MovieSelect;
const entrySelect={id:true,createdAt:true,rating:true,review:true,isRewatch:true,containsSpoilers:true,user:{select:publicMemberSelect},movie:{select:movieSelect}} satisfies Prisma.DiaryEntrySelect;
export type PublicEntry=Omit<Prisma.DiaryEntryGetPayload<{select:typeof entrySelect}>,'createdAt'> & {createdAt:string};
export interface PublicFilters {cursor?:string;userId?:string;movieId?:string;textOnly?:boolean}
function boundary(cursor?:string):Prisma.DiaryEntryWhereInput{
 if(!cursor)return {};
 try{
  if(cursor.length>1000)throw Error();
  const row=JSON.parse(Buffer.from(cursor,'base64url').toString());
  if(typeof row.id!=='string'||!row.id||row.id.length>200||typeof row.date!=='string'||!Number.isFinite(new Date(row.date).getTime()))throw Error();
  const createdAt=new Date(row.date);
  return {OR:[{createdAt:{lt:createdAt}},{createdAt,id:{lt:row.id}}]};
 }catch{throw new CommunityError('Invalid cursor',400);}
}
export async function listPublicEntries(filters:PublicFilters={}, {db=prisma,syncDisplays=true}:{db?:PrismaClient;syncDisplays?:boolean}={}){
 const rows=await db.diaryEntry.findMany({where:{AND:[publicEligibility,boundary(filters.cursor),{...(filters.userId?{userId:filters.userId}:{}),...(filters.movieId?{movieId:filters.movieId}:{}),...(filters.textOnly?{review:{not:''}}:{})}]},select:entrySelect,orderBy:[{createdAt:'desc'},{id:'desc'}],take:21});
 const entries=syncDisplays?await syncEntryMovies(rows.slice(0,20),{db}):rows.slice(0,20);const last=entries.at(-1);
 return {entries:entries.map(e=>({...e,createdAt:e.createdAt.toISOString()})),nextCursor:rows.length>20&&last?Buffer.from(JSON.stringify({id:last.id,date:last.createdAt.toISOString()})).toString('base64url'):null};
}
export async function getPublicReview(id:string,{db=prisma}:{db?:PrismaClient}={}){
 const entry=await db.diaryEntry.findFirst({where:{AND:[publicEligibility,{id,review:{not:''}}]},select:entrySelect});
 return entry?{...(await syncEntryMovies([entry],{db}))[0],createdAt:entry.createdAt.toISOString()}:null;
}
export async function getPublicProfile(username:string,{db=prisma,cursor}:{db?:PrismaClient;cursor?:string}={}){
 const user=await db.user.findFirst({where:{username,profilePublished:true},select:{id:true,...publicMemberSelect,bio:true,showFavorites:true}});
 if(!user)return null;
 // One database snapshot prevents mixed privacy state within this profile payload.
 const profile=await db.$transaction(async tx=>{
  const stillPublic=await tx.user.findFirst({where:{id:user.id,profilePublished:true},select:{...publicMemberSelect,bio:true,showFavorites:true}});
  if(!stillPublic)return null;
  const where={AND:[publicEligibility,{userId:user.id}]};
  const [logs,movies,favorites]=await Promise.all([
   tx.diaryEntry.count({where}),tx.diaryEntry.groupBy({by:['movieId'],where}),
   stillPublic.showFavorites?tx.likedBy.findMany({where:{userId:user.id},select:{movie:{select:movieSelect}},orderBy:{likedAt:'desc'}}):Promise.resolve([]),
  ]);
  return {username:stillPublic.username,name:stillPublic.name,image:stillPublic.image,bio:stillPublic.bio,statistics:{logs,movies:movies.length},favorites:favorites.map(r=>r.movie),...await listPublicEntries({userId:user.id,cursor},{db:tx as PrismaClient,syncDisplays:false})};
 },{isolationLevel:Prisma.TransactionIsolationLevel.RepeatableRead});
 return profile?{...profile,entries:await syncEntryMovies(profile.entries,{db}),favorites:await syncMovieDisplays(profile.favorites,{db})}:null;
}

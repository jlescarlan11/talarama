import 'server-only';
import type {PrismaClient} from '@prisma/client';
import prisma from '@/prisma/client';
export class RateLimitError extends Error {
 status=429;
 constructor(public retryAfter:number){super(`Too many changes. Try again in ${retryAfter} seconds. Your draft is retained.`);}
}
const limits={diary:30,library:60,report:5};
/** Fixed ten-minute DB-clock windows, atomic conditional upsert shared across all app processes. */
export async function consumeMutation(userId:string,kind:keyof typeof limits,{db=prisma}:{db?:PrismaClient}={}){
 await db.$executeRaw`DELETE FROM "MutationBucket" WHERE ("userId","kind","windowStart") IN
  (SELECT "userId","kind","windowStart" FROM "MutationBucket" WHERE "expiresAt" < CURRENT_TIMESTAMP ORDER BY "expiresAt" LIMIT 100)`;
 const rows=await db.$queryRaw<{count:number}[]>`
  INSERT INTO "MutationBucket" ("userId","kind","windowStart","count","expiresAt")
  VALUES (${userId},${kind},to_timestamp(floor(extract(epoch from CURRENT_TIMESTAMP)/600)*600),1,to_timestamp(floor(extract(epoch from CURRENT_TIMESTAMP)/600)*600+600))
  ON CONFLICT ("userId","kind","windowStart") DO UPDATE SET "count"="MutationBucket"."count"+1
  WHERE "MutationBucket"."count" < ${limits[kind]} RETURNING "count"`;
 if(!rows.length){
  const [clock]=await db.$queryRaw<{seconds:number}[]>`SELECT ceil(600 - mod(extract(epoch from CURRENT_TIMESTAMP),600))::int AS seconds`;
  throw new RateLimitError(Math.max(1,clock.seconds));
 }
}

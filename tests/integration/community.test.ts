import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {PrismaClient} from '@prisma/client';
import {beforeAll,afterAll,it,expect,vi} from 'vitest';
vi.mock('server-only',()=>({}));
const auth=vi.hoisted(()=>({id:'alice' as string|null}));
vi.mock('next-auth',()=>({getServerSession:async()=>auth.id?{user:{id:auth.id}}:null}));
vi.mock('@/app/auth/authOptions',()=>({default:{}}));
const raw=process.env.TEST_DATABASE_URL;
if(!raw || !new URL(raw).pathname.endsWith('_test')) throw Error('Requires disposable _test database');
const url=new URL(raw);const schema=`community_${randomUUID().replaceAll('-','')}`;url.searchParams.set('schema',schema);
const admin=new PrismaClient({datasourceUrl:raw});const db=new PrismaClient({datasourceUrl:url.toString()});
vi.mock('@/prisma/client',()=>({default:db}));
beforeAll(async()=>{
 await admin.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
 execFileSync(process.execPath,['node_modules/prisma/build/index.js','db','push','--skip-generate'],{env:{...process.env,DATABASE_URL:url.toString(),DIRECT_URL:url.toString()},stdio:'pipe'});
 await db.user.createMany({data:[{id:'alice',email:'private@example.invalid',username:'alice'},{id:'bob',email:'bob@example.invalid',username:'bob',profilePublished:true},{id:'admin',email:'admin@example.invalid',username:'operator',role:'ADMIN'}]});
 await db.movie.createMany({data:[{id:'film',title:'Shared film'},{id:'other-film',title:'Other film'}]});
},60000);
afterAll(async()=>{await db.$disconnect();await admin.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);await admin.$disconnect();});
it('strictly updates owner profile, refreshes identity and preserves ID/account links',async()=>{
 const {updateProfile,allocateUsername}=await import('@/app/services/profileService');
 await db.account.create({data:{id:'google-link',userId:'alice',provider:'google',type:'oauth',providerAccountId:'preserved-sub'}});
 const input={username:'Alice',name:'Alice',bio:'Hi',timeZone:'Asia/Manila',profilePublished:true,showFavorites:false};
 await expect(updateProfile('alice',{...input,role:'ADMIN'},{db})).rejects.toThrow();
 await updateProfile('alice',input,{db});
 expect(await db.user.findUniqueOrThrow({where:{id:'alice'}})).toMatchObject({id:'alice',username:'alice',role:'MEMBER'});
 expect(await db.account.findUniqueOrThrow({where:{id:'google-link'}})).toMatchObject({userId:'alice',providerAccountId:'preserved-sub'});
 await db.user.createMany({data:Array.from({length:8},(_,i)=>({id:`signup${i}`,email:`signup${i}@example.invalid`}))});
 const handles=await Promise.all(Array.from({length:8},(_,i)=>allocateUsername(`signup${i}`,{db,candidate:attempt=>attempt===0?'member_same':`member_${i}_${attempt}`})));
 expect(new Set(handles).size).toBe(8);expect(handles.every(h=>!h.includes('signup'))).toBe(true);
});
it('reviews username mappings with stale rollback, collision protection and durable audit',async()=>{
 const {applyReviewedUsernames}=await import('@/app/services/usernameMigrationService');
 await db.user.createMany({data:[{id:'old-a',email:'olda@example.invalid',username:'Old.A'},{id:'old-b',email:'oldb@example.invalid',username:'Old.B'}]});
 const mappings=[{id:'old-a',original:'Old.A',username:'old_a'},{id:'old-b',original:'stale',username:'old_b'}];
 await expect(applyReviewedUsernames({version:1,reviewedBy:'fixture reviewer',mappings},{db})).rejects.toThrow();
 expect((await db.user.findUniqueOrThrow({where:{id:'old-a'}})).username).toBe('Old.A');
 mappings[1].original='Old.B';await applyReviewedUsernames({version:1,reviewedBy:'fixture reviewer',mappings},{db});
 expect(await db.usernameMappingAudit.count()).toBe(1);
});
it('centralizes public eligibility, explicit safe selection, favorites opt-in and master-switch reversibility',async()=>{
 const {listPublicEntries,getPublicReview,getPublicProfile}=await import('@/app/services/publicEntryService');
 await db.diaryEntry.createMany({data:[
  {id:'eligible',userId:'alice',movieId:'film',visibility:'PUBLIC',review:'Safe review',rating:4,watchedDate:new Date('2001-01-01')},
  {id:'private',userId:'alice',movieId:'film',review:'PRIVATE_SECRET',rating:1,watchedDate:new Date('2002-01-01')},
  {id:'hidden',userId:'alice',movieId:'film',visibility:'PUBLIC',moderationState:'HIDDEN',review:'HIDDEN_SECRET',rating:1,watchedDate:new Date('2003-01-01')},
 ]});
 await db.likedBy.create({data:{userId:'alice',movieId:'film'}});await db.watchlistEntry.create({data:{userId:'alice',movieId:'other-film'}});
 const read=await listPublicEntries({},{db});expect(read.entries.map(e=>e.id)).toEqual(['eligible']);
 const text=JSON.stringify(await getPublicProfile('alice',{db}));
 for(const secret of ['email','accounts','watchedDate','watchlist','PRIVATE_SECRET','HIDDEN_SECRET','2001-01-01'])expect(text).not.toContain(secret);
 expect((await getPublicProfile('alice',{db}))?.favorites).toEqual([]);
 await db.user.update({where:{id:'alice'},data:{showFavorites:true}});expect((await getPublicProfile('alice',{db}))?.favorites).toHaveLength(1);
 await db.user.update({where:{id:'alice'},data:{profilePublished:false}});
 expect(await getPublicReview('eligible',{db})).toBeNull();expect(await getPublicProfile('alice',{db})).toBeNull();expect((await listPublicEntries({},{db})).entries).toEqual([]);
 await db.user.update({where:{id:'alice'},data:{profilePublished:true}});expect(await getPublicReview('eligible',{db})).not.toBeNull();
 await db.diaryEntry.update({where:{id:'eligible'},data:{visibility:'PRIVATE'}});expect(await getPublicReview('eligible',{db})).toBeNull();
 await db.diaryEntry.update({where:{id:'eligible'},data:{visibility:'PUBLIC'}});
});
it('uses stable twenty-item creation/ID boundaries even after cursor deletion',async()=>{
 const {listPublicEntries}=await import('@/app/services/publicEntryService');
 await db.diaryEntry.createMany({data:Array.from({length:25},(_,i)=>({id:`tie-${String(i).padStart(2,'0')}`,userId:'bob',movieId:'other-film',visibility:'PUBLIC',createdAt:new Date('2010-01-01'),watchedDate:new Date('2000-01-01')}))});
 const first=await listPublicEntries({movieId:'other-film'},{db});expect(first.entries).toHaveLength(20);
 await db.diaryEntry.delete({where:{id:first.entries.at(-1)!.id}});
 const second=await listPublicEntries({movieId:'other-film',cursor:first.nextCursor!},{db});expect(second.entries).toHaveLength(5);
 expect(new Set([...first.entries,...second.entries].map(e=>e.id)).size).toBe(25);
});
it('counts newest eligible rated member/movie once across ties, rewatches, nulls, hiding and deletion',async()=>{
 const {communityRating}=await import('@/app/services/communityRatingService');
 const at=new Date('2025-01-01');
 await db.diaryEntry.createMany({data:[{id:'rating-a',userId:'bob',movieId:'film',rating:2,visibility:'PUBLIC',createdAt:at,watchedDate:at},{id:'rating-z',userId:'bob',movieId:'film',rating:5,isRewatch:true,visibility:'PUBLIC',createdAt:at,watchedDate:at},{id:'rating-null',userId:'bob',movieId:'film',rating:null,visibility:'PUBLIC',watchedDate:at},{id:'rating-private',userId:'bob',movieId:'film',rating:1,watchedDate:at}]});
 expect(await communityRating('film',{db})).toEqual({average:4.5,count:2});
 await db.diaryEntry.update({where:{id:'rating-z'},data:{moderationState:'HIDDEN'}});expect(await communityRating('film',{db})).toEqual({average:3,count:2});
 await db.diaryEntry.delete({where:{id:'rating-a'}});expect(await communityRating('film',{db})).toEqual({average:4,count:1});
 await db.user.update({where:{id:'alice'},data:{profilePublished:false}});expect(await communityRating('film',{db})).toEqual({average:null,count:0});
 await db.user.update({where:{id:'alice'},data:{profilePublished:true}});
});
it('atomically admits exact shared quotas under concurrency and expires with bounded cleanup',async()=>{
 const {consumeMutation}=await import('@/app/lib/rateLimit');
 for(const [kind,limit] of [['diary',30],['library',60],['report',5]] as const){
  const results=await Promise.allSettled(Array.from({length:limit+8},()=>consumeMutation('limiter',kind,{db})));
  expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(limit);
  const denied=results.find(r=>r.status==='rejected') as PromiseRejectedResult;expect(denied.reason).toMatchObject({status:429});expect(denied.reason.retryAfter).toBeGreaterThan(0);
 }
 await db.mutationBucket.createMany({data:Array.from({length:150},(_,i)=>({userId:`expired-${i}`,kind:'diary',count:1,windowStart:new Date('2000-01-01'),expiresAt:new Date('2000-01-02')}))});
 await consumeMutation('cleanup','diary',{db});const left=await db.mutationBucket.count({where:{userId:{startsWith:'expired-'}}});expect(left).toBe(50);
});
it('enforces unique public-only reports, DB administrator authorization, audit and owner hidden visibility',async()=>{
 const {reportEntry,moderateReport,listReports}=await import('@/app/services/moderationService');
 const {getPublicReview}=await import('@/app/services/publicEntryService');
 await expect(reportEntry('bob','private','reason',{db})).rejects.toMatchObject({status:404});
 await expect(reportEntry('bob','eligible','x'.repeat(501),{db})).rejects.toThrow();
 const reports=await Promise.all(Array.from({length:4},()=>reportEntry('bob','eligible','Spam',{db})));expect(new Set(reports.map(r=>r.id)).size).toBe(1);
 await expect(listReports('bob',{db})).rejects.toMatchObject({status:403});
 await expect(moderateReport('bob',reports[0].id,{action:'hide'},{db})).rejects.toMatchObject({status:403});
 await moderateReport('admin',reports[0].id,{action:'hide'},{db});expect(await getPublicReview('eligible',{db})).toBeNull();
 expect(await db.diaryEntry.findUniqueOrThrow({where:{id:'eligible'}})).toMatchObject({moderationState:'HIDDEN',userId:'alice',review:'Safe review'});
 await moderateReport('admin',reports[0].id,{action:'unhide'},{db});expect(await getPublicReview('eligible',{db})).not.toBeNull();
 await moderateReport('admin',reports[0].id,{action:'resolve'},{db});expect(await db.moderationAudit.count()).toBe(3);expect((await listReports('admin',{db})).reports[0].resolvedAt).not.toBeNull();
});
it('applies durable limits to diary and combined library services while preserving successful create recovery',async()=>{
 const {createDiaryEntry,updateDiaryEntry,deleteDiaryEntry}=await import('@/app/services/diaryEntryService');
 const {setLibraryEntry}=await import('@/app/services/movieLibraryService');
 const input={movieId:'film',watchedDate:'2020-01-01',rating:null,review:'recover',visibility:'PRIVATE' as const,isRewatch:false,containsSpoilers:false,clientRequestId:randomUUID()};
 const saved=await createDiaryEntry('alice',input,{db});
 for(const kind of ['diary','library']) await db.mutationBucket.upsert({where:{userId_kind_windowStart:{userId:'unused',kind,windowStart:new Date('2000-01-01')}},create:{userId:'unused',kind,windowStart:new Date('2000-01-01'),expiresAt:new Date('2000-01-02'),count:1},update:{}});
 // Fill precisely the current database window without depending on the host clock.
 await db.$executeRaw`INSERT INTO "MutationBucket" ("userId","kind","windowStart","expiresAt","count") SELECT 'alice',kind,to_timestamp(floor(extract(epoch from CURRENT_TIMESTAMP)/600)*600),to_timestamp(floor(extract(epoch from CURRENT_TIMESTAMP)/600)*600+600),999 FROM unnest(ARRAY['diary','library']) AS kind ON CONFLICT ("userId","kind","windowStart") DO UPDATE SET "count"=999`;
 expect((await createDiaryEntry('alice',input,{db})).entry.id).toBe(saved.entry.id);
 await expect(createDiaryEntry('alice',{...input,clientRequestId:randomUUID()},{db})).rejects.toMatchObject({status:429});
 await expect(updateDiaryEntry('alice',saved.entry.id,input,{db})).rejects.toMatchObject({status:429});
 await expect(deleteDiaryEntry('alice',saved.entry.id,{db})).rejects.toMatchObject({status:429});
 for(const kind of ['favorite','watchlist'] as const) await expect(setLibraryEntry('alice','film',kind,true,{db})).rejects.toMatchObject({status:429});
 expect((await db.diaryEntry.findUniqueOrThrow({where:{id:saved.entry.id}})).review).toBe('recover');
});
it('keeps public and owner HTTP responses no-store, denies role injection, and supplies quota retry headers',async()=>{
 const {GET:profile,PATCH:save}=await import('@/app/api/profile/route');
 const {GET:feed}=await import('@/app/api/community/route');
 const {GET:review}=await import('@/app/api/reviews/[id]/route');
 const {GET:member}=await import('@/app/api/members/[username]/route');
 const {GET:movie}=await import('@/app/api/movies/[id]/reviews/route');
 const {GET:queue}=await import('@/app/api/admin/reports/route');
 const {POST:create}=await import('@/app/api/diaries/route');
 const {POST:like}=await import('@/app/api/movies/[id]/like/route');
 const context=(id:string)=>({params:Promise.resolve({id})});
 const request=(path:string)=>new Request(`http://localhost${path}`);
 auth.id=null;expect((await profile()).status).toBe(401);expect((await queue()).status).toBe(401);
 auth.id='alice';expect((await queue()).status).toBe(403);
 expect((await save(new Request('http://localhost/api/profile',{method:'PATCH',body:JSON.stringify({id:'admin',role:'ADMIN'})}))).status).toBe(400);
 const payload={movieId:'film',watchedDate:'2020-01-01',rating:4,review:'quota draft',visibility:'PRIVATE',isRewatch:false,containsSpoilers:false,clientRequestId:randomUUID()};
 for(const response of [await create(new Request('http://localhost/api/diaries',{method:'POST',body:JSON.stringify(payload)})),await like(request('/api/movies/film/like'),context('film'))]){
  expect(response.status).toBe(429);expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);expect((await response.json()).retryAfter).toBeGreaterThan(0);
 }
 await db.user.update({where:{id:'alice'},data:{profilePublished:false}});
 const responses=[await profile(),await feed(request('/api/community')),await review(request('/api/reviews/eligible'),context('eligible')),await member(request('/api/members/alice'),{params:Promise.resolve({username:'alice'})}),await movie(request('/api/movies/film/reviews'),context('film'))];
 expect(responses[2].status).toBe(404);expect(responses[3].status).toBe(404);
 for(const response of responses){expect(response.headers.get('cache-control')).toBe('no-store');const text=await response.text();expect(text).not.toContain('Safe review');expect(text).not.toContain('PRIVATE_SECRET');expect(text).not.toContain('private@example.invalid');}
 expect((await feed(request('/api/community?cursor=malformed'))).status).toBe(400);
 await db.user.update({where:{id:'alice'},data:{profilePublished:true}});
});
it('runs guarded operator preview/reviewed apply/admin bootstrap with exclusive journals and preserved links',async()=>{
 await db.user.create({data:{id:'cli-user',email:'cli-private@example.invalid',username:'CLI.Old'}});
 await db.account.create({data:{id:'cli-account',userId:'cli-user',provider:'google',type:'oauth',providerAccountId:'cli-preserved-sub'}});
 const folder=mkdtempSync(join(process.cwd(),'.superpowers','phase4-cli-'));
 const preview=join(folder,'preview.json'),manifest=join(folder,'manifest.json'),audit=join(folder,'audit.jsonl');
 const env={...process.env,DATABASE_URL:url.toString(),DIRECT_URL:url.toString()};
 const run=(script:string,args:string[],environment=env)=>execFileSync(process.execPath,['--conditions=react-server','--import','tsx',`scripts/${script}.ts`,...args],{env:environment,stdio:'pipe',encoding:'utf8'});
 run('username-preview',['preview',preview]);const rows=JSON.parse(readFileSync(preview,'utf8')).rows;
 expect(rows.find((r:{id:string})=>r.id==='cli-user')).toMatchObject({original:'CLI.Old',changed:true});
 expect((await db.user.findUniqueOrThrow({where:{id:'cli-user'}})).username).toBe('CLI.Old');
 writeFileSync(manifest,JSON.stringify({version:1,reviewedBy:'fixture operator',mappings:[{id:'cli-user',original:'CLI.Old',username:'cli_reviewed'}]}));
 writeFileSync(audit,'existing journal');expect(()=>run('username-preview',['--reviewed',manifest,audit])).toThrow();
 expect((await db.user.findUniqueOrThrow({where:{id:'cli-user'}})).username).toBe('CLI.Old');
 const freshAudit=join(folder,'fresh-audit.jsonl');run('username-preview',['--reviewed',manifest,freshAudit]);expect(readFileSync(freshAudit,'utf8')).toContain('COMMITTED');
 expect((await db.user.findUniqueOrThrow({where:{id:'cli-user'}})).username).toBe('cli_reviewed');expect((await db.account.findUniqueOrThrow({where:{id:'cli-account'}})).providerAccountId).toBe('cli-preserved-sub');
 run('set-admin',['cli-user','--grant-admin']);expect((await db.user.findUniqueOrThrow({where:{id:'cli-user'}})).role).toBe('ADMIN');
 expect(await db.moderationAudit.count({where:{action:'grant-admin:cli-user'}})).toBe(1);
 expect(()=>run('set-admin',['cli-user','--grant-admin'],{...env,DATABASE_URL:raw.replace('_test','_production')})).toThrow();
},30000);

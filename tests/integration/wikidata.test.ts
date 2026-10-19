import { beforeAll, afterAll, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
vi.mock('server-only', () => ({}));
import { createRetentionFixture } from '@/scripts/lib/tmdb-retention-fixtures';
import { importWikidataMovie } from '@/app/services/wikidataImportService';
import { seedLocalPreview } from '@/scripts/lib/local-preview-seed';
import type { WikidataMovie } from '@/app/lib/tmdb/types';
let scope: Awaited<ReturnType<typeof createRetentionFixture>>;
const detail: WikidataMovie = { localId:null,wikidataId:'Q25188',tmdbId:null,title:'Same title',description:'CC0 description',releasedYear:2010,duration:148,posterUrl:null,backdropUrl:null,tmdbScore:null,tmdbVoteCount:null,genres:[{wikidataId:'Q471839',name:'Science Fiction'}],cast:[],directors:[] };
const provider={details:async()=>detail};
const snapshot=async()=>({users:await scope.db.user.findMany(),accounts:await scope.db.account.findMany(),diaries:await scope.db.diaryEntry.findMany(),likes:await scope.db.likedBy.findMany(),watch:await scope.db.watchlistEntry.findMany(),legacy:await scope.db.movie.findUnique({where:{id:'wiki-legacy'}})});
beforeAll(async()=>{scope=await createRetentionFixture(process.env.TEST_DATABASE_URL!);},60000);
afterAll(async()=>{await scope?.dispose();});
it('applies actual additive SQL without changing legacy IDs, accounts, library, text or exact timestamps',async()=>{
 await scope.db.$executeRawUnsafe('DROP TABLE "ExternalMovieIdentity"');
 await scope.db.movie.create({data:{id:'wiki-legacy',tmdbId:42,title:'Same title',releasedYear:2010,duration:90}});
 await scope.db.user.create({data:{id:'wiki-owner',email:'wiki-owner@example.invalid',accounts:{create:{provider:'google',type:'oauth',providerAccountId:'preserved-sub',access_token:'synthetic-preserved'}}}});
 await scope.db.diaryEntry.create({data:{id:'wiki-entry',userId:'wiki-owner',movieId:'wiki-legacy',watchedDate:new Date('2020-02-29T23:30:00Z'),review:'Preserve this member text',rating:4}});
 await scope.db.likedBy.create({data:{userId:'wiki-owner',movieId:'wiki-legacy'}});await scope.db.watchlistEntry.create({data:{userId:'wiki-owner',movieId:'wiki-legacy'}});
 const before=await snapshot();
 const sql=readFileSync('prisma/migrations/20261019190000_wikidata_identity/migration.sql','utf8');
 // Each DDL statement is independent; only the generated disposable schema is used.
 for(const statement of sql.split(';').filter(sql=>sql.trim()))await scope.db.$executeRawUnsafe(statement);
 expect(await snapshot()).toEqual(before);
 expect(before.diaries[0].watchedDate.toISOString()).toBe('2020-02-29T23:30:00.000Z');
});
it('converges concurrent Q imports without merging an identically titled legacy/TMDB movie',async()=>{
 const before=await snapshot();const movies=await Promise.all(Array.from({length:6},()=>importWikidataMovie('Q25188',{db:scope.db,provider})));
 expect(new Set(movies.map(movie=>movie.id)).size).toBe(1);expect(movies[0].id).not.toBe('wiki-legacy');expect(movies[0].tmdbId).toBeNull();
 expect(await scope.db.externalMovieIdentity.count()).toBe(1);expect(await snapshot()).toEqual(before);
 const retry={details:vi.fn(async()=>{throw Error('must not refetch');})};
 expect((await importWikidataMovie('Q25188',{db:scope.db,provider:retry})).id).toBe(movies[0].id);expect(retry.details).not.toHaveBeenCalled();
});
it('rejects provider identity mismatch without creating movies or identity links',async()=>{
 const before=await scope.db.movie.count();
 await expect(importWikidataMovie('Q42',{db:scope.db,provider})).rejects.toThrow('identity');
 expect(await scope.db.movie.count()).toBe(before);expect(await scope.db.externalMovieIdentity.findUnique({where:{provider_externalId:{provider:'WIKIDATA',externalId:'Q42'}}})).toBeNull();
});
it('seeds no invented movies or reviews in the live Wikidata preview',async()=>{
 const fixture=await createRetentionFixture(process.env.TEST_DATABASE_URL!);
 try{
  await seedLocalPreview(fixture.db,true);
  expect(await fixture.db.user.count()).toBe(1);
  expect(await fixture.db.movie.count()).toBe(0);
  expect(await fixture.db.diaryEntry.count()).toBe(0);
 }finally{await fixture.dispose();}
},30000);

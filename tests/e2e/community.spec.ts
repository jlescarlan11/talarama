import {test,expect,type BrowserContext} from '@playwright/test';
import {encode} from 'next-auth/jwt';
import {PrismaClient} from '@prisma/client';
async function signIn(context:BrowserContext,id:string){const token=await encode({secret:process.env.TALARAMA_E2E_SECRET!,token:{sub:id,id,username:'community_member',email:`${id}@example.invalid`,name:'Community member'}});await context.addCookies([{name:'next-auth.session-token',value:token,url:'http://127.0.0.1:3100',httpOnly:true,sameSite:'Lax'}]);}
test('publication, safe reviews, spoilers and visited-page master switch across layouts',async({page,context,browser})=>{
 const db=new PrismaClient({datasourceUrl:process.env.TALARAMA_E2E_DATABASE_URL});
 const visitor=await browser.newContext();const reader=await visitor.newPage();
 try{
  await db.user.create({data:{id:'community-owner',email:'community-owner@example.invalid',username:'community_member',name:'Community member'}});
  await db.diaryEntry.createMany({data:[{id:'public-browser-review',userId:'community-owner',movieId:'browser-movie',rating:4,review:'A spoiler about the ending',visibility:'PUBLIC',containsSpoilers:true,watchedDate:new Date('2001-02-03')},{id:'private-browser-review',userId:'community-owner',movieId:'browser-movie',rating:1,review:'PRIVATE_BROWSER_SECRET',watchedDate:new Date('2002-03-04')},{id:'rating-only-browser',userId:'community-owner',movieId:'browser-movie',rating:5,visibility:'PUBLIC',watchedDate:new Date('2000-01-01')}]});
  await signIn(context,'community-owner');await page.goto('/settings/profile');
  await expect(page.getByRole('heading',{name:'Profile settings'})).toBeVisible();
  expect((await page.request.get('/api/members/community_member')).status()).toBe(404);
  await page.getByLabel('Bio').fill('A community movie journal');await page.getByLabel('Publish profile').check();
  await page.getByRole('button',{name:'Save profile'}).click();await expect(page.getByRole('status').filter({hasText:'Profile saved'})).toBeVisible();
  expect((await page.request.get('/api/auth/session')).status()).toBe(200);
  for(const width of [360,768,1440]){
   await reader.setViewportSize({width,height:1000});await reader.emulateMedia({colorScheme:width===768?'dark':'light',reducedMotion:'reduce'});
   await reader.goto('http://127.0.0.1:3100/members/community_member');
   await expect(reader.getByRole('heading',{name:'Community member',exact:true})).toBeVisible();
   await expect(reader.getByText('2 public logs · 1 distinct public movie')).toBeVisible();
   await expect(reader.getByText('A spoiler about the ending',{exact:true})).toBeHidden();
   await reader.getByText('Reveal spoiler').first().click();await expect(reader.getByText('A spoiler about the ending',{exact:true})).toBeVisible();
   expect(await reader.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await reader.screenshot({path:`.superpowers/phase4-profile-${width}.png`,fullPage:true,caret:'initial'});
  }
  await reader.goto('http://127.0.0.1:3100/reviews/public-browser-review');await expect(reader.getByRole('article')).toBeVisible();
  await page.getByLabel('Publish profile').uncheck();await page.getByRole('button',{name:'Save profile'}).click();await expect(page.getByRole('status').filter({hasText:'Profile saved'})).toBeVisible();
  await reader.evaluate(()=>window.dispatchEvent(new Event('focus')));
  await expect(reader.getByRole('heading',{name:'Not found',exact:true})).toBeVisible();
  for(const path of ['/api/reviews/public-browser-review','/api/members/community_member','/api/community','/api/movies/browser-movie/reviews']){
   const response=await reader.request.get(`http://127.0.0.1:3100${path}`);expect(response.headers()['cache-control']).toBe('no-store');const text=await response.text();expect(text).not.toContain('A spoiler about the ending');expect(text).not.toContain('PRIVATE_BROWSER_SECRET');expect(text).not.toContain('2001-02-03');
  }
  await reader.goto('http://127.0.0.1:3100/community');await expect(reader.getByText('No public activity yet')).toBeVisible();
  await page.getByLabel('Publish profile').check();await page.getByRole('button',{name:'Save profile'}).click();await expect(page.getByRole('status').filter({hasText:'Profile saved'})).toBeVisible();
  await reader.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(reader.getByRole('article')).toHaveCount(2);
  await reader.goto('http://127.0.0.1:3100/movies/browser-movie');await expect(reader.getByText('Talarama 5.0/5')).toBeVisible();
  await page.getByLabel('Publish profile').uncheck();await page.getByRole('button',{name:'Save profile'}).click();await expect(page.getByRole('status').filter({hasText:'Profile saved'})).toBeVisible();
  await reader.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(reader.getByText('Talarama: not rated')).toBeVisible();await expect(reader.getByRole('article').filter({hasText:'A spoiler about the ending'})).toHaveCount(0);
  // Resume a previously visited Next route after privacy changed while away.
  await page.getByLabel('Publish profile').check();await page.getByRole('button',{name:'Save profile'}).click();await expect(page.getByRole('status').filter({hasText:'Profile saved'})).toBeVisible();
  await reader.goto('http://127.0.0.1:3100/community');await expect(reader.getByRole('article')).toHaveCount(2);
  await reader.getByRole('link',{name:'Discover',exact:true}).click();await expect(reader).toHaveURL(/\/movies/);
  await page.getByLabel('Publish profile').uncheck();await page.getByRole('button',{name:'Save profile'}).click();await expect(page.getByRole('status').filter({hasText:'Profile saved'})).toBeVisible();
  await reader.goBack();await expect(reader.getByText('No public activity yet')).toBeVisible();await expect(reader.getByRole('article')).toHaveCount(0);
 }finally{await visitor.close();await db.diaryEntry.deleteMany({where:{userId:'community-owner'}});await db.account.deleteMany({where:{userId:'community-owner'}});await db.user.deleteMany({where:{id:'community-owner'}});await db.$disconnect();}
});
test('member reporting and administrator audited hide/unhide/resolve preserve owner history',async({page,context})=>{
 const db=new PrismaClient({datasourceUrl:process.env.TALARAMA_E2E_DATABASE_URL});
 try{
  await db.user.createMany({data:[{id:'moderated-owner',email:'moderated@example.invalid',username:'moderated_owner',profilePublished:true},{id:'reporter',email:'reporter@example.invalid',username:'reporter'},{id:'moderator',email:'moderator@example.invalid',username:'moderator',role:'ADMIN'}]});
  await db.diaryEntry.create({data:{id:'moderated-entry',userId:'moderated-owner',movieId:'browser-movie',rating:3,review:'Reported browser review',visibility:'PUBLIC',watchedDate:new Date('2000-01-01')}});
  await signIn(context,'reporter');await page.goto('/reviews/moderated-entry');await page.getByText('Report review',{exact:true}).click();await page.getByLabel('Report reason').fill('Spam report');await page.getByRole('button',{name:'Submit report'}).click();await expect(page.getByRole('status').filter({hasText:'Report received'})).toBeVisible();
  const report=await db.entryReport.findFirstOrThrow({where:{entryId:'moderated-entry'}});
  expect((await page.request.patch(`/api/admin/reports/${report.id}`,{data:{action:'hide'}})).status()).toBe(403);
  expect((await page.request.patch('/api/profile',{data:{role:'ADMIN'}})).status()).toBe(400);
  await signIn(context,'moderator');await page.goto('/admin/reports');
  const article=page.getByRole('article').filter({hasText:'Spam report'});await article.getByRole('button',{name:'Hide entry',exact:true}).click();await expect(article.getByText('HIDDEN',{exact:true})).toBeVisible();
  expect((await page.request.get('/api/reviews/moderated-entry')).status()).toBe(404);
  await article.getByRole('button',{name:'Unhide entry'}).click();await expect(article.getByText('VISIBLE',{exact:true})).toBeVisible();
  await article.getByRole('button',{name:'Resolve report'}).click();await expect(article.getByText('Resolved',{exact:true})).toBeVisible();
  await article.getByRole('button',{name:'Hide entry',exact:true}).click();
  await signIn(context,'moderated-owner');await page.goto('/diaries');await page.getByRole('tab',{name:'My Diary',exact:true}).click();await expect(page.getByText('Hidden by moderation',{exact:false})).toBeVisible();
  expect(await db.moderationAudit.count({where:{entryId:'moderated-entry'}})).toBe(4);
 }finally{await db.entryReport.deleteMany({where:{entryId:'moderated-entry'}});await db.diaryEntry.deleteMany({where:{id:'moderated-entry'}});await db.user.deleteMany({where:{id:{in:['moderated-owner','reporter','moderator']}}});await db.$disconnect();}
});

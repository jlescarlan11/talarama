import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

test('existing member saves, logs, edits and deletes a viewing through the browser', async ({ context, page }) => {
  // Synthetic signed JWT exercises application auth/session wiring, not Google OAuth.
  const token = await encode({ secret: process.env.TALARAMA_E2E_SECRET!, token: { sub: 'browser-owner', id: 'browser-owner', username: 'browser_member', name: 'Browser member', email: 'browser@example.invalid', picture: '/appLogoLight.png' } });
  await context.addCookies([{ name: 'next-auth.session-token', value: token, url: 'http://127.0.0.1:3100', httpOnly: true, sameSite: 'Lax' }]);
  const db = new PrismaClient({ datasourceUrl: process.env.TALARAMA_E2E_DATABASE_URL });
  try {
    // Existing diary avatars request quality 100; keep that working after Next upgrades.
    expect((await page.request.get('/_next/image?url=%2FappLogoLight.png&w=128&q=100')).status()).toBe(200);
    expect((await page.request.get('/movies/new', { maxRedirects: 0 })).status()).toBe(200);
    await page.goto('/movies/browser-movie');
    const saved = page.waitForResponse(response => response.url().endsWith('/api/movies/browser-movie/watchlist') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Add to Watchlist' }).click();
    expect((await saved).status()).toBe(200);
    await expect(page.getByRole('button', { name: 'In Watchlist' })).toBeVisible();
    await page.getByRole('button', { name: 'Like movie', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Unlike movie', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Log Now' }).click();
    await page.getByRole('button', { name: 'Rate 4 out of 5' }).click();
    await page.getByLabel('Watched Date').fill('2020-02-29');
    // Empty review is intentionally valid and must persist as an empty string.
    await page.getByRole('button', { name: 'Save Entry', exact: true }).click();
    await expect(page).toHaveURL(/\/diaries$/);
    const entry = await db.diaryEntry.findFirstOrThrow({ where: { userId: 'browser-owner' } });
    expect(entry).toMatchObject({ movieId: 'browser-movie', rating: 4, review: '' });
    await page.goto(`/diaries/edit/${entry.id}`);
    await page.getByLabel('Review (optional)').fill('Edited in the browser');
    await page.getByRole('button', { name: 'Rate 5 out of 5' }).click();
    const updated = page.waitForResponse(response => response.url().includes(`/api/diaries/${entry.id}`) && response.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Update Entry', exact: true }).click();
    expect((await updated).status()).toBe(200);
    await expect(page).toHaveURL(/\/diaries$/, { timeout: 15000 });
    await page.getByRole('tab', { name: 'My Diary', exact: true }).click();
    await expect(page.getByText('Edited in the browser', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Entry options' }).click();
    await page.getByRole('menuitem', { name: 'Delete Entry' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete Entry', exact: true }).click();
    await expect.poll(() => db.diaryEntry.count({ where: { userId: 'browser-owner' } })).toBe(0);
    expect(await db.account.findUnique({ where: { id: 'browser-google-link' } })).toMatchObject({ userId: 'browser-owner', providerAccountId: 'synthetic-google-sub' });
    expect(await db.likedBy.count()).toBe(1);
    expect(await db.watchlistEntry.count()).toBe(0);
  } finally { await db.$disconnect(); }
});

test('unrated rewatches preserve dates, retries, privacy and filters across layouts',async({context,page,browser})=>{
 const token=await encode({secret:process.env.TALARAMA_E2E_SECRET!,token:{sub:'browser-owner',id:'browser-owner',username:'browser_member',name:'Browser member'}});
 await context.addCookies([{name:'next-auth.session-token',value:token,url:'http://127.0.0.1:3100',httpOnly:true,sameSite:'Lax'}]);
 const db=new PrismaClient({datasourceUrl:process.env.TALARAMA_E2E_DATABASE_URL});
 try{
  for(const width of [360,768,1440]) {
   await page.setViewportSize({width,height:1000});await page.emulateMedia({colorScheme:width===768?'dark':'light',reducedMotion:'reduce'});
   await context.setDefaultTimeout(15000);
   await page.goto('/diaries/new?movieId=browser-movie');
   await expect(page.getByLabel('Visibility')).toHaveValue('PRIVATE');
   await expect(page.getByRole('button',{name:'No rating'})).toHaveAttribute('aria-pressed','true');
   await page.getByLabel('Watched Date').fill('2020-02-29');
   await page.getByLabel('Rewatch',{exact:true}).check();await page.getByLabel('Contains spoilers').check();
   await page.getByLabel('Review (optional)').fill(`Private draft ${width}`);
   // Server commits, transport loses reply: retry must reuse original UUID.
   let lost=true;const bodies:Record<string,unknown>[]=[];
   await page.route('**/api/diaries',async route=>{if(route.request().method()!=='POST')return route.continue();bodies.push(route.request().postDataJSON());if(lost){lost=false;await route.fetch();return route.abort('failed');}return route.continue();});
   await page.getByRole('button',{name:'Save Entry',exact:true}).focus();await page.keyboard.press('Enter');
   await expect(page.locator('main').getByRole('alert')).toBeVisible();
   await expect(page.getByLabel('Review (optional)')).toHaveValue(`Private draft ${width}`);
   await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`.superpowers/phase3-form-${width}.png`,fullPage:true,caret:'initial'});
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.getByRole('button',{name:'Save Entry',exact:true}).click();
   await expect(page).toHaveURL(/\/diaries$/);
   await page.unroute('**/api/diaries');
   expect(bodies).toHaveLength(2);expect(bodies[0].clientRequestId).toBe(bodies[1].clientRequestId);
   const entry=await db.diaryEntry.findUniqueOrThrow({where:{userId_clientRequestId:{userId:'browser-owner',clientRequestId:bodies[0].clientRequestId as string}}});
   expect(entry).toMatchObject({rating:null,isRewatch:true,containsSpoilers:true,visibility:'PRIVATE'});expect(entry.watchedDate.toISOString()).toBe('2020-02-29T00:00:00.000Z');
   await page.getByLabel('Search diary').fill('Phase Zero');await page.getByLabel('Watched year').fill('2020');await page.getByLabel('Rating filter').selectOption('unrated');await page.getByRole('button',{name:'Filter',exact:true}).click();
   await expect(page.getByText('February 2020',{exact:true})).toBeVisible();await expect(page.getByText(`Private draft ${width}`,{exact:true})).toBeVisible();await expect(page.locator('span').filter({hasText:/^Not rated$/}).first()).toBeVisible();
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
   await page.screenshot({path:`.superpowers/phase3-diary-${width}.png`,fullPage:true,caret:'initial'});
  }
  // Same movie/date, distinct intentional viewings are retained.
  expect(await db.diaryEntry.count({where:{userId:'browser-owner',movieId:'browser-movie'}})).toBe(3);
  const entry=await db.diaryEntry.findFirstOrThrow({where:{userId:'browser-owner'}});
  await page.goto(`/diaries/edit/${entry.id}`);await page.getByLabel('Visibility').selectOption('PUBLIC');await page.getByRole('button',{name:'Update Entry'}).click();await expect(page).toHaveURL(/\/diaries$/);
  const shifted=await browser.newContext({timezoneId:'Pacific/Honolulu'});
  try{await shifted.addCookies([{name:'next-auth.session-token',value:token,url:'http://127.0.0.1:3100',httpOnly:true,sameSite:'Lax'}]);const viewer=await shifted.newPage();await viewer.goto(`http://127.0.0.1:3100/diaries/edit/${entry.id}`);await expect(viewer.getByLabel('Watched Date')).toHaveValue('2020-02-29');}finally{await shifted.close();}
  await context.clearCookies();
  for(const path of ['/movies/browser-movie','/api/movies']){const response=await page.request.get(path);expect(await response.text()).not.toContain('Private draft');}
  expect((await page.request.get(`/api/diaries/${entry.id}`)).status()).toBe(401);
  await db.user.create({data:{id:'browser-intruder',email:'intruder@example.invalid',username:'browser_intruder'}});
  const intruder=await encode({secret:process.env.TALARAMA_E2E_SECRET!,token:{sub:'browser-intruder',id:'browser-intruder',username:'browser_intruder',email:'intruder@example.invalid'}});
  await context.addCookies([{name:'next-auth.session-token',value:intruder,url:'http://127.0.0.1:3100',httpOnly:true,sameSite:'Lax'}]);
  expect((await page.request.get(`/api/diaries/${entry.id}`)).status()).toBe(404);
  expect((await page.request.delete(`/api/diaries/${entry.id}`)).status()).toBe(404);
  expect((await page.request.get('/api/diaries')).headers()['cache-control']).toBe('no-store');
 }finally{await db.diaryEntry.deleteMany({where:{userId:'browser-owner'}});await db.$disconnect();}
});

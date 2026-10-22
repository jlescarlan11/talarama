import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import {encode} from 'next-auth/jwt';
test('normal Wikipedia posters refresh automatically while save/log omit transient artwork',async({page,context})=>{
 test.setTimeout(120000);const db=new PrismaClient({datasourceUrl:process.env.TALARAMA_E2E_DATABASE_URL});
 const imageUrl='https://upload.wikimedia.org/wikipedia/en/a/ab/Wikipedia_fixture_poster.jpg';
 try{
  await page.route(imageUrl,route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHxkAAAAASUVORK5CYII=','base64')}));
  const before=await db.movie.count();
  await page.clock.install();
  for(const width of [360,1440]){
   await page.setViewportSize({width,height:1000});await page.goto('/movies');
   const image=page.getByRole('img',{name:'Poster for Wikidata Fixture Film'});await expect(image).toHaveAttribute('src',imageUrl);expect(await image.evaluate((img:HTMLImageElement)=>img.complete&&img.naturalWidth>0)).toBe(true);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await expect(page.getByText(/member records are disposable fixtures/)).toHaveCount(0);
  const catalog=await (await page.request.get('/api/catalog')).json();
  const refreshedUrl=imageUrl.replace('Wikipedia_fixture_poster.jpg','Updated_fixture_poster.jpg');
  await page.route(refreshedUrl,route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHxkAAAAASUVORK5CYII=','base64')}));
  await page.route('**/api/catalog?**',route=>route.fulfill({json:{...catalog,results:catalog.results.map((movie:Record<string,unknown>)=>({...movie,posterUrl:refreshedUrl}))}}));
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.clock.fastForward(60001);
  await expect(page.getByRole('img',{name:'Poster for Wikidata Fixture Film'})).toHaveAttribute('src',refreshedUrl);
  await page.unroute('**/api/catalog?**');
  await page.clock.resume();
  await page.goto('/movies/wikidata/Q25188');await expect(page.getByRole('heading',{level:1,name:'Wikidata Fixture Film'})).toBeVisible();
  await expect(page.getByRole('link',{name:'Poster source: Wikipedia',exact:true})).toBeVisible();await expect(page.getByRole('link',{name:'Copyrighted (Wikipedia)',exact:true})).toBeVisible();expect(await db.movie.count()).toBe(before);
  const token=await encode({secret:process.env.TALARAMA_E2E_SECRET!,token:{sub:'browser-owner',id:'browser-owner',username:'browser_member'}});await context.addCookies([{name:'next-auth.session-token',value:token,url:'http://127.0.0.1:3100',httpOnly:true,sameSite:'Lax'}]);await page.reload();
  await page.getByRole('button',{name:'Add to Watchlist'}).click();await expect(page.getByRole('button',{name:'In Watchlist'})).toBeVisible({timeout:20000});
  const identity=await db.externalMovieIdentity.findUniqueOrThrow({where:{provider_externalId:{provider:'WIKIDATA',externalId:'Q25188'}}});const saved=await db.movie.findUniqueOrThrow({where:{id:identity.movieId}});
  expect(saved.posterUrl).toBeNull();expect(saved.credits).not.toHaveProperty('posterCredit');
  await page.getByRole('button',{name:'Log Now'}).click();await page.getByLabel('Watched Date').fill('2020-02-29');await page.getByRole('button',{name:'Save Entry'}).click();await expect(page).toHaveURL(/\/diaries$/);
  expect(await db.diaryEntry.count({where:{movieId:saved.id,userId:'browser-owner'}})).toBe(1);expect(await db.watchlistEntry.count({where:{movieId:saved.id,userId:'browser-owner'}})).toBe(0);
  await page.goto(`/movies/${saved.id}`);await expect(page.getByRole('img',{name:'Poster for Wikidata Fixture Film'})).toHaveAttribute('src',imageUrl);
 }finally{await db.$disconnect();}
});

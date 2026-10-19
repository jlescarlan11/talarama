import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import {encode} from 'next-auth/jwt';
test('Wikidata browse/detail preserve reads, identities, save/log actions and original UI',async({page,context})=>{
 const db=new PrismaClient({datasourceUrl:process.env.TALARAMA_E2E_DATABASE_URL});
 try{
  const before=await db.movie.count();
  for(const width of [360,768,1440]){
   await page.setViewportSize({width,height:1000});await page.goto('/');await expect(page.getByRole('heading',{name:'Welcome to Movie Diary'})).toBeVisible();
   await page.goto('/movies');await expect(page.getByRole('button',{name:'Browse movies'})).toBeVisible();
   await expect(page.getByRole('link',{name:/Wikidata Fixture Film/})).toHaveAttribute('href','/movies/wikidata/Q25188');
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByRole('link',{name:/Wikidata Second Film/})).toBeVisible();
  await page.goto('/movies?mode=discover&year=2010&genre=878&page=1');await expect(page.getByRole('link',{name:/Wikidata Fixture Film/})).toBeVisible();
  await page.getByRole('link',{name:/Wikidata Fixture Film/}).click();await expect(page.getByRole('heading',{name:'Wikidata Fixture Film'})).toBeVisible();
  await expect(page.getByRole('link',{name:'View source on Wikidata'})).toBeVisible();expect(await db.movie.count()).toBe(before);
  const token=await encode({secret:process.env.TALARAMA_E2E_SECRET!,token:{sub:'browser-owner',id:'browser-owner',username:'browser_member',name:'Browser member'}});
  await context.addCookies([{name:'next-auth.session-token',value:token,url:'http://127.0.0.1:3100',httpOnly:true,sameSite:'Lax'}]);await page.reload();
  await page.getByRole('button',{name:'Add to Watchlist'}).click();await expect(page.getByRole('button',{name:'In Watchlist'})).toBeVisible();
  await page.getByRole('button',{name:'Like movie',exact:true}).click();await expect(page.getByRole('button',{name:'Unlike movie'})).toBeVisible();
  const mapping=await db.externalMovieIdentity.findUniqueOrThrow({where:{provider_externalId:{provider:'WIKIDATA',externalId:'Q25188'}}});
  expect(await db.movie.count()).toBe(before+1);expect((await db.movie.findUniqueOrThrow({where:{id:mapping.movieId}})).tmdbId).toBeNull();
  await page.getByRole('button',{name:'Log Now'}).click();await page.getByLabel('Watched Date').fill('2020-02-29');await page.getByRole('button',{name:'Save Entry'}).click();await expect(page).toHaveURL(/\/diaries$/);
  expect(await db.diaryEntry.count({where:{movieId:mapping.movieId,userId:'browser-owner'}})).toBe(1);expect(await db.watchlistEntry.count({where:{movieId:mapping.movieId}})).toBe(0);expect(await db.likedBy.count({where:{movieId:mapping.movieId}})).toBe(1);
  await page.goto(`/movies/${mapping.movieId}`);await expect(page.getByRole('heading',{name:'Wikidata Fixture Film'})).toBeVisible();
 }finally{await db.$disconnect();}
});

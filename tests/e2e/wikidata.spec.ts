import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import {encode} from 'next-auth/jwt';
test('Wikidata browse/detail preserve reads, identities, save/log actions and original UI',async({page,context})=>{
 test.setTimeout(120000);
 const db=new PrismaClient({datasourceUrl:process.env.TALARAMA_E2E_DATABASE_URL});
 try{
  await page.route('https://upload.wikimedia.org/wikipedia/commons/a/ab/Wikidata_fixture_poster.png',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aHxkAAAAASUVORK5CYII=','base64')}));
  const before=await db.movie.count();
  const defaults=await (await page.request.get('/api/catalog')).json();
  expect(defaults.order).toBe('recent');expect(defaults.totalResults).toBe(13);expect(defaults.hasMore).toBe(true);
  expect(defaults.results.every((movie:{posterUrl:string;releasedYear:number})=>movie.posterUrl&&movie.releasedYear===new Date().getUTCFullYear()-1)).toBe(true);
  for(const width of [360,768,1440]){
   await page.setViewportSize({width,height:1000});await page.goto('/');await expect(page.getByRole('heading',{name:'Welcome to Movie Diary'})).toBeVisible();
   const carousel=page.getByRole('region',{name:'Movie carousel'});await expect(carousel.getByRole('img')).toHaveCount(5);
   for(const image of await carousel.getByRole('img').all())await expect(image).toHaveAttribute('src','https://upload.wikimedia.org/wikipedia/commons/a/ab/Wikidata_fixture_poster.png');
   await page.goto('/movies');await expect(page.getByRole('button',{name:'Browse movies'})).toBeVisible();
   await expect(page.getByText(/Recent movies with verified posters/)).toBeVisible();
   await expect(page.getByRole('link',{name:/Wikidata Fixture Film/})).toHaveAttribute('href','/movies/wikidata/Q25188');
   const image=page.getByRole('img',{name:'Poster for Wikidata Fixture Film'});await expect(image).toHaveAttribute('src','https://upload.wikimedia.org/wikipedia/commons/a/ab/Wikidata_fixture_poster.png');expect(await image.evaluate((element:HTMLImageElement)=>element.complete && element.naturalWidth>0)).toBe(true);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  }
  for(let next=2;next<=6;next++){await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByRole('link',{name:new RegExp(`Wikidata Film Q${25188+(next-1)*12} `)})).toBeVisible();}
  await expect(page.getByRole('link',{name:/Poster for Classic Fixture Film/})).toBeVisible();
  await expect(page.getByRole('link',{name:/Poster for Silent Classic Fixture Film/})).toBeVisible();
  await expect(page.getByRole('button',{name:'Next',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByRole('link',{name:/Continued Fixture Film Q91009 /})).toBeVisible();
  await page.getByRole('button',{name:'Next',exact:true}).click();await expect(page.getByRole('link',{name:/Continued Fixture Film Q91021 /})).toBeVisible();
  await expect(page.getByRole('button',{name:'Next',exact:true})).toBeDisabled();expect(await db.movie.count()).toBe(before);
  await page.goto(`/movies?mode=discover&year=${new Date().getUTCFullYear()-1}&genre=878&page=1`);await expect(page.getByRole('link',{name:/Wikidata Fixture Film/})).toBeVisible();
  await page.getByRole('link',{name:/Wikidata Fixture Film/}).click();await expect(page).toHaveURL(/\/movies\/(wikidata\/Q25188|[a-z0-9-]+)$/,{timeout:20000});await expect(page.getByRole('heading',{name:'Wikidata Fixture Film',level:1})).toBeVisible();
  await expect(page.getByRole('link',{name:'View source on Wikidata'})).toBeVisible();expect(await db.movie.count()).toBe(before);
  await expect(page.getByRole('link',{name:'Poster source: Wikimedia Commons'})).toBeVisible();await expect(page.getByRole('link',{name:'Public domain'})).toBeVisible();
  const token=await encode({secret:process.env.TALARAMA_E2E_SECRET!,token:{sub:'browser-owner',id:'browser-owner',username:'browser_member',name:'Browser member'}});
  await context.addCookies([{name:'next-auth.session-token',value:token,url:'http://127.0.0.1:3100',httpOnly:true,sameSite:'Lax'}]);await page.reload();
  // Cold Next dev route compilation can exceed the default five-second assertion.
  await page.getByRole('button',{name:'Add to Watchlist'}).click();await expect(page.getByRole('button',{name:'In Watchlist'})).toBeVisible({timeout:20000});
  await page.getByRole('button',{name:'Like movie',exact:true}).click();await expect(page.getByRole('button',{name:'Unlike movie'})).toBeVisible({timeout:20000});
  const mapping=await db.externalMovieIdentity.findUniqueOrThrow({where:{provider_externalId:{provider:'WIKIDATA',externalId:'Q25188'}}});
  expect(await db.movie.count()).toBe(before+1);expect((await db.movie.findUniqueOrThrow({where:{id:mapping.movieId}})).tmdbId).toBeNull();
  await page.getByRole('button',{name:'Log Now'}).click();await page.getByLabel('Watched Date').fill('2020-02-29');await page.getByRole('button',{name:'Save Entry'}).click();await expect(page).toHaveURL(/\/diaries$/);
  await expect(page.getByRole('img',{name:'Wikidata Fixture Film poster'})).toHaveAttribute('src','https://upload.wikimedia.org/wikipedia/commons/a/ab/Wikidata_fixture_poster.png');
  expect(await db.diaryEntry.count({where:{movieId:mapping.movieId,userId:'browser-owner'}})).toBe(1);expect(await db.watchlistEntry.count({where:{movieId:mapping.movieId}})).toBe(0);expect(await db.likedBy.count({where:{movieId:mapping.movieId}})).toBe(1);
  // Deliberately stale snapshot in this disposable schema. Display refresh must
  // share the provider cache across API/RSC bundles without rewriting the row.
  await db.movie.update({where:{id:mapping.movieId},data:{title:'Stored snapshot before sync',posterUrl:null,duration:100}});
  const beforeSync={movie:await db.movie.findUniqueOrThrow({where:{id:mapping.movieId}}),entries:await db.diaryEntry.findMany(),likes:await db.likedBy.findMany()};
  await page.reload();await expect(page.getByRole('img',{name:'Wikidata Fixture Film poster'})).toHaveAttribute('src','https://upload.wikimedia.org/wikipedia/commons/a/ab/Wikidata_fixture_poster.png');
  const displayed=await(await page.request.get('/api/movies')).json();
  expect(displayed.find((movie:{id:string})=>movie.id===mapping.movieId)).toMatchObject({id:mapping.movieId,title:'Wikidata Fixture Film',duration:null,posterUrl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Wikidata_fixture_poster.png'});
  expect({movie:await db.movie.findUniqueOrThrow({where:{id:mapping.movieId}}),entries:await db.diaryEntry.findMany(),likes:await db.likedBy.findMany()}).toEqual(beforeSync);
  await page.goto(`/movies/${mapping.movieId}`);await expect(page).toHaveURL(/\/movies\/(wikidata\/Q25188|[a-z0-9-]+)$/,{timeout:20000});await expect(page.getByRole('heading',{name:'Wikidata Fixture Film',level:1})).toBeVisible();
 }finally{await db.$disconnect();}
});

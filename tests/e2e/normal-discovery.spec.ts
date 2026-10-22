import {test,expect} from '@playwright/test';
import {PrismaClient} from '@prisma/client';
import {encode} from 'next-auth/jwt';

test('normal signed-in discovery survives artwork failure and refreshes without changing accounts or diary data',async({page,context})=>{
 const db=new PrismaClient({datasourceUrl:process.env.TALARAMA_E2E_DATABASE_URL});
 try{
  await db.diaryEntry.create({data:{id:'normal-preserved-entry',userId:'browser-owner',movieId:'browser-movie',rating:4,review:'Keep my private review',watchedDate:new Date('2000-01-01')}});
  const before={users:await db.user.findMany(),accounts:await db.account.findMany(),entries:await db.diaryEntry.findMany(),movies:await db.movie.findMany()};
  const token=await encode({secret:process.env.TALARAMA_E2E_SECRET!,token:{sub:'browser-owner',id:'browser-owner',username:'browser_member'}});
  await context.addCookies([{name:'next-auth.session-token',value:token,url:'http://127.0.0.1:3100',httpOnly:true,sameSite:'Lax'}]);
  await page.clock.install();
  const response=await page.request.get('/api/catalog');expect(response.status()).toBe(200);
  const data=await response.json();expect(data.results).toHaveLength(12);expect(data.results.every((movie:{posterUrl:string|null})=>movie.posterUrl===null)).toBe(true);
  await page.goto('/movies');await expect(page.getByRole('img',{name:'Poster for Wikidata Fixture Film'})).toHaveAttribute('src','/placeholder-movie.svg');
  await expect(page.getByText(/member records are disposable fixtures/)).toHaveCount(0);
  await expect(page.getByText(/Movie provider is unavailable/)).toHaveCount(0);
  await page.getByLabel('Release year').fill('1999');
  const url=page.url();let reads=0;
  await page.route('**/api/catalog?**',route=>{reads++;return route.fulfill({json:{...data,results:data.results.map((movie:Record<string,unknown>,index:number)=>index===0?{...movie,title:'Normal refreshed film'}:movie)}});});
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0,{timeout:20000});
  await page.clock.fastForward(60001);
  await expect(page.getByRole('img',{name:'Poster for Normal refreshed film'})).toBeVisible({timeout:20000});
  expect(reads).toBe(1);expect(page.url()).toBe(url);await expect(page.getByLabel('Release year')).toHaveValue('1999');
  expect({users:await db.user.findMany(),accounts:await db.account.findMany(),entries:await db.diaryEntry.findMany(),movies:await db.movie.findMany()}).toEqual(before);
 }finally{await db.$disconnect();}
});

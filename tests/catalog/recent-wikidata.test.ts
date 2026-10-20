// @vitest-environment node
import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {WikidataClient} from '@/app/lib/wikidata/client';

const year=new Date().getUTCFullYear();
const entity=(id:string,released:number,poster=true)=>({id,labels:{en:{value:id}},claims:{P31:[{mainsnak:{datavalue:{value:{id:'Q11424'}}}}],P577:[{mainsnak:{datavalue:{value:{time:`+${released}-01-01T00:00:00Z`,precision:11}}}}],...(poster?{P3383:[{mainsnak:{datavalue:{value:`${id} poster.jpg`}}}]}:{})}});
function transport(){
 const rows=[...Array.from({length:25},(_,i)=>entity(`Q${100+i}`,year-i%3)),entity('Q200',2000),entity('Q201',year,false),entity('Q202',year+1)];
 return vi.fn<typeof fetch>(async input=>{
  const url=new URL(String(input));
  if(url.hostname==='query.wikidata.org')return Response.json({results:{bindings:rows.map(row=>({film:{value:`http://www.wikidata.org/entity/${row.id}`}}))}});
  if(url.hostname==='commons.wikimedia.org')return Response.json({query:{pages:(url.searchParams.get('titles')||'').split('|').map(title=>({title,imagerepository:'local',imageinfo:[{width:1000,height:1500,mime:'image/jpeg',thumburl:`https://upload.wikimedia.org/wikipedia/commons/a/ab/${title.slice(5).replaceAll(' ','_')}`,descriptionurl:`https://commons.wikimedia.org/wiki/${title.replaceAll(' ','_')}`,extmetadata:{License:{value:'pd'},LicenseShortName:{value:'Public domain'},AttributionRequired:{value:'false'}}}]}))}});
  if(url.searchParams.get('list')==='search')return Response.json({query:{searchinfo:{totalhits:1},search:[{title:'Q200'}]}});
  return Response.json({entities:Object.fromEntries(rows.filter(row=>(url.searchParams.get('ids')||'').split('|').includes(row.id)).map(row=>[row.id,row]))});
 });
}
it('defaults to a bounded live recent selection with posters, sorted by release year and paged after artwork filtering',async()=>{
 const fetcher=transport();const client=new WikidataClient({fetcher,wikipediaPreview:false});
 const first=await client.discover();const second=await client.discover({page:2});const third=await client.discover({page:3});
 expect(first).toMatchObject({order:'recent',totalResults:25,totalPages:3});
 expect(first.results).toHaveLength(12);expect(second.results).toHaveLength(12);expect(third.results).toHaveLength(1);
 const all=[...first.results,...second.results,...third.results];
 expect(new Set(all.map(movie=>'wikidataId'in movie?movie.wikidataId:'')).size).toBe(25);
 expect(all.every(movie=>movie.posterUrl&&movie.releasedYear!>=year-2&&movie.releasedYear!<=year)).toBe(true);
 expect(all.map(movie=>movie.releasedYear)).toEqual(all.map(movie=>movie.releasedYear).sort((a,b)=>b!-a!));
 expect(fetcher.mock.calls.filter(call=>new URL(String(call[0])).hostname==='query.wikidata.org')).toHaveLength(1);
 const query=new URL(String(fetcher.mock.calls[0][0])).searchParams.get('query');expect(query).toContain(`${year-2}-01-01`);expect(query).toContain('LIMIT 60');
 expect((await client.discover({page:4})).results).toEqual([]);
});
it('keeps explicit genre and title browsing available across all release years',async()=>{
 const fetcher=transport();const client=new WikidataClient({fetcher});
 expect((await client.discover({genre:878})).results[0].releasedYear).toBe(2000);
 expect((await client.search({query:'Old film'})).results[0].releasedYear).toBe(2000);
 expect(fetcher.mock.calls.some(call=>new URL(String(call[0])).hostname==='query.wikidata.org')).toBe(false);
});
it('recovers poster outages without repeating the recent metadata query, and validates pages before I/O',async()=>{
 const upstream=transport();let unavailable=true;
 const fetcher=vi.fn<typeof fetch>(async(input,options)=>new URL(String(input)).hostname==='commons.wikimedia.org'&&unavailable?new Response('',{status:503}):upstream(input,options));
 const client=new WikidataClient({fetcher,wikipediaPreview:false});
 await expect(client.discover({page:0})).rejects.toMatchObject({code:'INVALID_INPUT'});expect(fetcher).not.toHaveBeenCalled();
 await expect(client.discover()).rejects.toMatchObject({code:'UNAVAILABLE'});
 unavailable=false;expect((await client.discover()).results).toHaveLength(12);
 expect(upstream.mock.calls.filter(call=>new URL(String(call[0])).hostname==='query.wikidata.org')).toHaveLength(1);
});

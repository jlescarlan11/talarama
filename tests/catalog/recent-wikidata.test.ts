// @vitest-environment node
import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {WikidataClient} from '@/app/lib/wikidata/client';
import {DiscoveryPrefetch} from '@/app/lib/wikidata/discovery-prefetch';

const year=new Date().getUTCFullYear();
const entity=(id:string,released:number,poster=true)=>({id,labels:{en:{value:id}},claims:{P31:[{mainsnak:{datavalue:{value:{id:'Q11424'}}}}],P577:[{mainsnak:{datavalue:{value:{time:`+${released}-01-01T00:00:00Z`,precision:11}}}}],...(poster?{P3383:[{mainsnak:{datavalue:{value:`${id} poster.jpg`}}}]}:{})}});
function transport(rows=[...Array.from({length:25},(_,i)=>entity(`Q${100+i}`,year-i%3)),entity('Q200',2000),entity('Q201',year,false),entity('Q202',year+1)],older:ReturnType<typeof entity>[]=[]){
 return vi.fn<typeof fetch>(async input=>{
  const url=new URL(String(input));
  if(url.hostname==='query.wikidata.org'){
   const query=url.searchParams.get('query')||'';
   const lower=/\?date >= "([^"]+)"/.exec(query)?.[1]||'';
   const upper=/\?date < "([^"]+)"/.exec(query)?.[1]||'9999';
   const cursor=/FILTER\(\?links < (\d+) \|\|/.exec(query);
   const lastFilm=/STR\(\?film\) > "([^"]+)"/.exec(query)?.[1]||'';
   const limit=Number(/LIMIT (\d+)/.exec(query)?.[1]||240);
   const selected=rows.map((row,index)=>({row,links:10000-index})).filter(({row,links})=>{const released=row.claims.P577[0].mainsnak.datavalue.value.time.slice(1);return released>=lower&&released<upper&&(!cursor||links<Number(cursor[1])||(links===Number(cursor[1])&&`http://www.wikidata.org/entity/${row.id}`>lastFilm));}).slice(0,limit);
   return Response.json({results:{bindings:selected.map(({row,links})=>({film:{value:`http://www.wikidata.org/entity/${row.id}`},links:{value:String(links)}}))}});
  }
  if(url.hostname==='commons.wikimedia.org')return Response.json({query:{pages:(url.searchParams.get('titles')||'').split('|').map(title=>({title,imagerepository:'local',imageinfo:[{width:1000,height:1500,mime:'image/jpeg',thumburl:`https://upload.wikimedia.org/wikipedia/commons/a/ab/${title.slice(5).replaceAll(' ','_')}`,descriptionurl:`https://commons.wikimedia.org/wiki/${title.replaceAll(' ','_')}`,extmetadata:{License:{value:'pd'},LicenseShortName:{value:'Public domain'},AttributionRequired:{value:'false'}}}]}))}});
  if(url.searchParams.get('list')==='search')return Response.json({query:{searchinfo:{totalhits:1},search:url.searchParams.get('srlimit')==='240'?older.map(row=>({title:row.id})):[{title:'Q200'}]}});
  return Response.json({entities:Object.fromEntries([...rows,...older].filter(row=>(url.searchParams.get('ids')||'').split('|').includes(row.id)).map(row=>[row.id,row]))});
 });
}
it('shares idle-prefetched verified posters and ordering with later browsing without extra upstream reads',async()=>{
 const fetcher=transport(Array.from({length:60},(_,i)=>entity(`Q${1000+i}`,year-i%3)));
 const client=new WikidataClient({fetcher,wikipediaPreview:false});let now=0;
 const prefetch=new DiscoveryPrefetch(number=>client.discover({page:number}),{now:()=>now});
 for(let sweep=0;sweep<3;sweep++){await prefetch.tick();now+=60000;}
 const reads=fetcher.mock.calls.length;
 const third=await client.discover({page:3});const first=await client.discover();
 expect(first.results).toHaveLength(12);expect(third.results).toHaveLength(12);
 expect(first.results.every(movie=>movie.releasedYear===year&&movie.posterUrl)).toBe(true);
 expect(third.results.every(movie=>movie.releasedYear===year-1&&movie.posterUrl)).toBe(true);
 expect(fetcher).toHaveBeenCalledTimes(reads);
});
it('expands the recent catalog beyond a shared 240-film pool while keeping current-year posters ahead of prior years',async()=>{
 const rows=Array.from({length:540},(_,i)=>entity(`Q${10000+i}`,year-Math.floor(i/180),i!==0));
 const fetcher=transport(rows);const client=new WikidataClient({fetcher,wikipediaPreview:false});
 const results=[];let page=1;let last;
 do{last=await client.discover({page:page++});results.push(...last.results);}while(last.hasMore);
 expect(results).toHaveLength(539);
 expect(new Set(results.map(movie=>movie.wikidataId)).size).toBe(539);
 expect(results.every(movie=>!!movie.posterUrl)).toBe(true);
 expect(results.map(movie=>movie.releasedYear)).toEqual(results.map(movie=>movie.releasedYear).sort((a,b)=>b!-a!));
 const queries=fetcher.mock.calls.map(call=>new URL(String(call[0]))).filter(url=>url.hostname==='query.wikidata.org').map(url=>url.searchParams.get('query')!);
 expect(queries).toHaveLength(3);
 for(const [index,query] of queries.entries()){expect(query).toContain(`${year-index}-01-01`);expect(query).toContain('FILTER(?links >= 1)');expect(query).toContain('LIMIT 240');}
});
it('continues each recent year beyond its opening pool and discovers more than 720 candidates without dropping newer posters behind older years',async()=>{
 const rows=Array.from({length:900},(_,i)=>entity(`Q${10000+i}`,year-Math.floor(i/300),i!==0));
 const fetcher=transport(rows);const client=new WikidataClient({fetcher,wikipediaPreview:false});
 const first=await client.discover();expect(fetcher.mock.calls.filter(call=>new URL(String(call[0])).hostname==='query.wikidata.org')).toHaveLength(1);
 const results=[...first.results];let last=first;
 for(let page=2;last.hasMore;page++){last=await client.discover({page});results.push(...last.results);}
 expect(results).toHaveLength(899);expect(new Set(results.map(movie=>movie.wikidataId)).size).toBe(899);
 expect(results.every(movie=>!!movie.posterUrl)).toBe(true);
 expect(results.map(movie=>movie.releasedYear)).toEqual(results.map(movie=>movie.releasedYear).sort((a,b)=>b!-a!));
 expect(results[298].releasedYear).toBe(year);expect(results[299].releasedYear).toBe(year-1);
 expect((await client.discover()).results).toEqual(first.results);
});
it('coalesces recent continuation reads, follows tied rankings, and retries a failed or nonadvancing cursor without losing the opening pages',async()=>{
 const rows=Array.from({length:253},(_,i)=>entity(`Q${10000+i}`,year));
 const upstream=transport(rows);let mode:'failure'|'stuck'|'healthy'='failure';
 const fetcher=vi.fn<typeof fetch>(async(input,options)=>{
  const url=new URL(String(input));const query=url.searchParams.get('query')||'';
  if(url.hostname!=='query.wikidata.org')return upstream(input,options);
  if(!query.includes(`?date >= "${year}-`))return Response.json({results:{bindings:[]}});
  const cursor=/STR\(\?film\) > "http:\/\/www.wikidata.org\/entity\/(Q\d+)"/.exec(query)?.[1];
  if(cursor&&mode==='failure')return new Response('',{status:503});
  const selected=cursor?(mode==='stuck'?[rows[239]]:rows.filter(row=>row.id>cursor).slice(0,48)):rows.slice(0,240);
  return Response.json({results:{bindings:selected.map(row=>({film:{value:`http://www.wikidata.org/entity/${row.id}`},links:{value:'10'}}))}});
 });
 const client=new WikidataClient({fetcher,wikipediaPreview:false});const first=await client.discover();
 await expect(client.discover({page:20})).rejects.toMatchObject({code:'UNAVAILABLE'});
 mode='stuck';await expect(client.discover({page:20})).rejects.toMatchObject({code:'INVALID_RESPONSE'});
 mode='healthy';const [twentieth,twentyFirst]=await Promise.all([client.discover({page:20}),client.discover({page:21})]);
 expect(twentieth.results.map(movie=>movie.wikidataId)).toEqual(rows.slice(228,240).map(row=>row.id));
 expect(twentyFirst.results.map(movie=>movie.wikidataId)).toEqual(rows.slice(240,252).map(row=>row.id));
 expect(await client.discover({page:22})).toMatchObject({hasMore:false,totalResults:253,results:[{wikidataId:'Q10252'}]});
 expect((await client.discover()).results).toEqual(first.results);
 const continuations=fetcher.mock.calls.filter(call=>new URL(String(call[0])).searchParams.get('query')?.includes('FILTER(?links <'));
 expect(continuations).toHaveLength(3);
});
it('bounds fresh recent continuation work and resumes sparse-poster scans from cached progress automatically on the next read',async()=>{
 const rows=Array.from({length:445},(_,i)=>entity(`Q${10000+i}`,year,i>=432));
 const fetcher=transport(rows);const client=new WikidataClient({fetcher,wikipediaPreview:false});
 await expect(client.discover()).rejects.toMatchObject({code:'TIMEOUT'});
 const queries=()=>fetcher.mock.calls.filter(call=>new URL(String(call[0])).hostname==='query.wikidata.org');
 expect(queries()).toHaveLength(5);
 expect(await client.discover()).toMatchObject({hasMore:true,results:expect.any(Array)});
 expect(queries()).toHaveLength(6);
 const last=await client.discover({page:2});expect(last).toMatchObject({hasMore:false,totalResults:13,results:[{wikidataId:'Q10444'}]});
});
it('loads only the newest year on the homepage and discovers newly available films after the hourly refresh',async()=>{
 vi.useFakeTimers();
 try{
  const rows=Array.from({length:24},(_,i)=>entity(`Q${1000+i}`,year));
  const fetcher=transport(rows);const client=new WikidataClient({fetcher,wikipediaPreview:false});
  const first=await client.discover();expect(first.results[0].wikidataId).toBe('Q1000');
  const queries=()=>fetcher.mock.calls.map(call=>new URL(String(call[0]))).filter(url=>url.hostname==='query.wikidata.org');
  expect(queries()).toHaveLength(1);expect(queries()[0].searchParams.get('query')).toContain(`${year}-01-01`);
  rows.unshift(entity('Q999',year));
  expect((await client.discover()).results).toEqual(first.results);
  await vi.advanceTimersByTimeAsync(3600001);
  expect((await client.discover()).results[0].wikidataId).toBe('Q999');expect(queries()).toHaveLength(2);
 }finally{vi.useRealTimers();}
});
it('defaults to a bounded live recent selection with posters, sorted by release year and paged after artwork filtering',async()=>{
 const fetcher=transport();const client=new WikidataClient({fetcher,wikipediaPreview:false});
 const first=await client.discover();const second=await client.discover({page:2});const third=await client.discover({page:3});
 expect(first).toMatchObject({order:'recent',hasMore:true});expect(third).toMatchObject({totalResults:25,totalPages:3,hasMore:false});
 expect(first.results).toHaveLength(12);expect(second.results).toHaveLength(12);expect(third.results).toHaveLength(1);
 const all=[...first.results,...second.results,...third.results];
 expect(new Set(all.map(movie=>'wikidataId'in movie?movie.wikidataId:'')).size).toBe(25);
 expect(all.every(movie=>movie.posterUrl&&movie.releasedYear!>=year-2&&movie.releasedYear!<=year)).toBe(true);
 expect(all.map(movie=>movie.releasedYear)).toEqual(all.map(movie=>movie.releasedYear).sort((a,b)=>b!-a!));
 expect(fetcher.mock.calls.filter(call=>new URL(String(call[0])).hostname==='query.wikidata.org')).toHaveLength(3);
 const query=new URL(String(fetcher.mock.calls[0][0])).searchParams.get('query');expect(query).toContain(`${year}-01-01`);expect(query).toContain('LIMIT 240');
 expect((await client.discover({page:4})).results).toEqual([]);
});
it('keeps a failed prior-year boundary retryable and excludes recent regional re-releases from the current year',async()=>{
 const rows=[...Array.from({length:13},(_,i)=>entity(`Q${1000+i}`,year)),entity('Q500',year-1)];
 const upstream=transport(rows);let fail=true;
 const fetcher=vi.fn<typeof fetch>(async(input,options)=>{
  const url=new URL(String(input));const query=url.searchParams.get('query')||'';
  if(url.hostname==='query.wikidata.org'){
   if(query.includes(`?date >= "${year-1}-`)&&fail)return new Response('',{status:503});
   if(query.includes(`?date >= "${year}-`))return Response.json({results:{bindings:rows.map((row,index)=>({film:{value:`http://www.wikidata.org/entity/${row.id}`},links:{value:String(10000-index)}}))}});
  }
  return upstream(input,options);
 });
 const client=new WikidataClient({fetcher,wikipediaPreview:false});const first=await client.discover();
 expect(first.results.every(movie=>movie.releasedYear===year)).toBe(true);
 await expect(client.discover({page:2})).rejects.toMatchObject({code:'UNAVAILABLE'});
 fail=false;const second=await client.discover({page:2});
 expect(second.results.map(movie=>movie.wikidataId)).toEqual(['Q1012','Q500']);expect(second.hasMore).toBe(false);
 expect((await client.discover()).results).toEqual(first.results);
 const currentReads=fetcher.mock.calls.filter(call=>{const url=new URL(String(call[0]));return url.hostname==='query.wikidata.org'&&(url.searchParams.get('query')||'').includes(`?date >= "${year}-`);});
 expect(currentReads).toHaveLength(1);
});
it('follows continuation batches beyond the featured pool, deduplicates IDs and leaves earlier pages stable',async()=>{
 const recent=Array.from({length:25},(_,i)=>entity(`Q${100+i}`,year-i%3));
 const older=[entity('Q300',1957),entity('Q301',1942)];
 const additions=[entity('Q401',2011),entity('Q402',2000),entity('Q403',1999,false),entity('Q404',year)];
 const upstream=transport(recent,[...older,...additions]);
 const fetcher=vi.fn<typeof fetch>(async(input,options)=>{
  const url=new URL(String(input));if(url.searchParams.get('list')==='search'){
   const offset=Number(url.searchParams.get('sroffset')||0);
   const selected=offset===0?older:offset===240?[older[0],additions[0],additions[2],additions[3]]:[additions[1]];
   return Response.json({...(offset===288?{}:{continue:{sroffset:offset===0?240:288}}),query:{search:selected.map(row=>({title:row.id}))}});
  }return upstream(input,options);
 });
 const client=new WikidataClient({fetcher,wikipediaPreview:false});
 const first=await client.discover();const second=await client.discover({page:2});const third=await client.discover({page:3});
 const all=[...first.results,...second.results,...third.results];
 expect(all).toHaveLength(29);expect(third).toMatchObject({hasMore:false,totalResults:29});
 expect(all.slice(25).map(movie=>movie.releasedYear)).toEqual([1957,1942,2011,2000]);
 expect(new Set(all.map(movie=>'wikidataId'in movie?movie.wikidataId:'')).size).toBe(29);
 expect((await client.discover()).results).toEqual(first.results);
 expect(fetcher.mock.calls.map(call=>new URL(String(call[0]))).filter(url=>url.searchParams.get('list')==='search').map(url=>[url.searchParams.get('sroffset'),url.searchParams.get('srlimit')])).toEqual([['0','240'],['240','48'],['288','48']]);
});
it('bounds cold continuation scans and resumes cached progress on retry',async()=>{
 const additions=Array.from({length:13},(_,i)=>entity(`Q${9000+i}`,2000));const upstream=transport([],additions);
 const fetcher=vi.fn<typeof fetch>(async(input,options)=>{
  const url=new URL(String(input));if(url.searchParams.get('list')!=='search')return upstream(input,options);
  const offset=Number(url.searchParams.get('sroffset'));
  return Response.json({...(offset===432?{}:{continue:{sroffset:offset===0?240:offset+48}}),query:{search:offset===432?additions.map(row=>({title:row.id})):[]}});
 });
 const client=new WikidataClient({fetcher,wikipediaPreview:false});
 await expect(client.discover()).rejects.toMatchObject({code:'TIMEOUT'});
 const calls=()=>fetcher.mock.calls.map(call=>new URL(String(call[0]))).filter(url=>url.searchParams.get('list')==='search');
 expect(calls()).toHaveLength(5);
 expect(await client.discover()).toMatchObject({hasMore:true,results:expect.any(Array)});
 expect(calls()).toHaveLength(6);expect(await client.discover({page:2})).toMatchObject({hasMore:false,totalResults:13});
});
it('rejects nonadvancing continuation offsets and retries without reporting a final page',async()=>{
 const upstream=transport([],[entity('Q301',1957)]);let broken=true;
 const fetcher=vi.fn<typeof fetch>(async(input,options)=>{
  const url=new URL(String(input));if(url.searchParams.get('list')==='search')return broken?Response.json({continue:{sroffset:240},query:{search:[]}}):Response.json({query:{search:[{title:'Q301'}]}});
  return upstream(input,options);
 });
 const client=new WikidataClient({fetcher,wikipediaPreview:false});
 await expect(client.discover()).rejects.toMatchObject({code:'INVALID_RESPONSE'});
 broken=false;expect(await client.discover()).toMatchObject({hasMore:false,totalResults:1});
});
it('appends older films and classics after recent posters without loading their source on the homepage',async()=>{
 const recent=Array.from({length:25},(_,i)=>entity(`Q${100+i}`,year-i%3));
 const older=[entity('Q300',year-3),entity('Q301',1957),entity('Q302',1927),entity('Q303',1999,false),entity('Q304',year)];
 const fetcher=transport(recent,older);const client=new WikidataClient({fetcher,wikipediaPreview:false});
 const first=await client.discover();expect(fetcher.mock.calls.some(call=>new URL(String(call[0])).searchParams.get('list')==='search')).toBe(false);
 const second=await client.discover({page:2});const third=await client.discover({page:3});
 const all=[...first.results,...second.results,...third.results];
 expect(all).toHaveLength(28);expect(third).toMatchObject({hasMore:false,totalResults:28,totalPages:3});
 expect(all.slice(25).map(movie=>movie.releasedYear)).toEqual([year-3,1957,1927]);
 expect(all.every(movie=>movie.posterUrl)).toBe(true);
 expect(new Set(all.map(movie=>'wikidataId'in movie?movie.wikidataId:'')).size).toBe(28);
 expect(all.map(movie=>movie.releasedYear)).toEqual(all.map(movie=>movie.releasedYear).sort((a,b)=>b!-a!));
});
it('keeps a failed older-catalog boundary retryable without reloading recent metadata',async()=>{
 const upstream=transport(Array.from({length:13},(_,i)=>entity(`Q${100+i}`,year)),[entity('Q300',1957)]);let fail=true;
 const fetcher=vi.fn<typeof fetch>(async(input,options)=>{const url=new URL(String(input));return fail&&url.searchParams.get('srlimit')==='240'?new Response('',{status:503}):upstream(input,options);});
 const client=new WikidataClient({fetcher,wikipediaPreview:false});await client.discover();
 await expect(client.discover({page:2})).rejects.toMatchObject({code:'UNAVAILABLE'});
 fail=false;expect((await client.discover({page:2})).results.map(movie=>movie.releasedYear)).toEqual([year,1957]);
 expect(upstream.mock.calls.filter(call=>new URL(String(call[0])).hostname==='query.wikidata.org')).toHaveLength(3);
});
it('can show verified classics when the recent source has no eligible movies',async()=>{
 const client=new WikidataClient({fetcher:transport([],[entity('Q301',1957),entity('Q302',1927)]),wikipediaPreview:false});
 expect(await client.discover()).toMatchObject({hasMore:false,totalResults:2,results:[{wikidataId:'Q301',releasedYear:1957},{wikidataId:'Q302',releasedYear:1927}]});
});
it('splits oversized historical metadata batches while retaining the response body limit',async()=>{
 const upstream=transport([],Array.from({length:5},(_,i)=>entity(`Q${301+i}`,1957-i)));
 const cancelled=vi.fn();
 const fetcher=vi.fn<typeof fetch>(async(input,options)=>{
  const url=new URL(String(input));const count=url.searchParams.get('ids')?.split('|').length??0;
  return count>2?new Response(new ReadableStream({cancel:cancelled}),{headers:{'content-length':String(8*1024*1024+1)}}):upstream(input,options);
 });
 const client=new WikidataClient({fetcher,wikipediaPreview:false});
 expect(await client.discover()).toMatchObject({hasMore:false,totalResults:5});
 const entityCalls=fetcher.mock.calls.map(call=>new URL(String(call[0]))).filter(url=>url.searchParams.get('action')==='wbgetentities');
 expect(entityCalls.map(url=>url.searchParams.get('ids')!.split('|').length)).toEqual([5,3,2,1,2]);
 expect(cancelled).toHaveBeenCalledTimes(2);
 const single=new WikidataClient({fetcher:async()=>new Response('{}',{headers:{'content-length':String(8*1024*1024+1)}})});
 await expect(single.details('Q301')).rejects.toMatchObject({code:'INVALID_RESPONSE'});
});
it('splits oversized cloned responses without waiting for an unread sibling stream to cancel',async()=>{
 vi.useFakeTimers();
 try{
  for(const declaredLength of [true,false]){
   const upstream=transport([],Array.from({length:5},(_,i)=>entity(`Q${301+i}`,1957-i)));
   const siblings:ReadableStream[]=[];const signals:AbortSignal[]=[];
   try{
    const fetcher:typeof fetch=async(input,options)=>{
     const count=new URL(String(input)).searchParams.get('ids')?.split('|').length??0;
     if(count<=2)return upstream(input,options);
     const original=new Response(new ReadableStream({start(controller){if(!declaredLength)controller.enqueue(new Uint8Array(8*1024*1024+1));}}),declaredLength?{headers:{'content-length':String(8*1024*1024+1)}}:undefined);
     const cloned=original.clone();siblings.push(original.body!);signals.push(options!.signal!);
     return cloned;
    };
    const result=new WikidataClient({fetcher,wikipediaPreview:false}).discover().then(data=>({data}),error=>({error}));
    await vi.advanceTimersByTimeAsync(21000);
    expect(await result).toMatchObject({data:{totalResults:5,hasMore:false}});
    expect(signals).toHaveLength(2);expect(signals.every(signal=>signal.aborted)).toBe(true);
   }finally{await Promise.allSettled(siblings.map(stream=>stream.cancel()));}
  }
 }finally{vi.useRealTimers();}
});
it('expands beyond 42 results, checks posters lazily, and keeps each upstream entity batch within 50 IDs',async()=>{
 const rows=Array.from({length:100},(_,i)=>entity(`Q${1000+i}`,year-i%3,i%5!==0));
 const fetcher=transport(rows);const client=new WikidataClient({fetcher,wikipediaPreview:false});
 const first=await client.discover();expect(first.results).toHaveLength(12);expect(first.hasMore).toBe(true);
 const posterCalls=()=>fetcher.mock.calls.map(call=>new URL(String(call[0]))).filter(url=>url.hostname==='commons.wikimedia.org');
 expect(posterCalls().length).toBeLessThan(4);
 const checked=posterCalls().length;await client.discover();expect(posterCalls()).toHaveLength(checked);
 const results=[...first.results];let last=first;
 for(let page=2;last.hasMore;page++){last=await client.discover({page});results.push(...last.results);}
 expect(results).toHaveLength(80);expect(last).toMatchObject({totalResults:80,totalPages:7,hasMore:false});
 expect(new Set(results.map(movie=>'wikidataId'in movie?movie.wikidataId:'')).size).toBe(80);
 expect(results.every(movie=>movie.posterUrl)).toBe(true);
 expect(results.map(movie=>movie.releasedYear)).toEqual(results.map(movie=>movie.releasedYear).sort((a,b)=>b!-a!));
 const reads=fetcher.mock.calls.map(call=>new URL(String(call[0]))).filter(url=>url.searchParams.get('action')==='wbgetentities');
 expect(reads).toHaveLength(3);expect(reads.every(url=>url.searchParams.get('ids')!.split('|').length<=50)).toBe(true);
});
it('coalesces overlapping pages without racing a shared discovery cursor',async()=>{
 const fetcher=transport(Array.from({length:60},(_,i)=>entity(`Q${1000+i}`,year-i%3)));
 const client=new WikidataClient({fetcher,wikipediaPreview:false});
 const [third,first,second]=await Promise.all([client.discover({page:3}),client.discover(),client.discover({page:2})]);
 const results=[...first.results,...second.results,...third.results];
 expect(results).toHaveLength(36);expect(new Set(results.map(movie=>'wikidataId'in movie?movie.wikidataId:'')).size).toBe(36);
 expect(results.map(movie=>movie.releasedYear)).toEqual(results.map(movie=>movie.releasedYear).sort((a,b)=>b!-a!));
 expect(fetcher.mock.calls.filter(call=>new URL(String(call[0])).hostname==='commons.wikimedia.org')).toHaveLength(4);
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
 expect(upstream.mock.calls.filter(call=>new URL(String(call[0])).hostname==='query.wikidata.org')).toHaveLength(3);
});

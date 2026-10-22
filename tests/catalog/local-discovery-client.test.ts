// @vitest-environment node
import {expect,it,vi} from 'vitest';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
vi.mock('server-only',()=>({}));
import {WikidataClient} from '@/app/lib/wikidata/client';
import {LocalDiscoveryCache} from '@/app/lib/wikidata/local-discovery-cache';
it('reuses persisted discovery metadata after restart while revalidating posters, preserving source IDs and order',async()=>{
 const root=await mkdtemp(join(tmpdir(),'talarama-discovery-client-'));const year=new Date().getUTCFullYear();
 const value=(value:unknown)=>({mainsnak:{datavalue:{value}}});
 const fetcher=vi.fn<typeof fetch>(async input=>{
  const url=new URL(String(input));
  if(url.hostname==='query.wikidata.org')return Response.json({results:{bindings:(url.searchParams.get('query')!.includes(`?date >= "${year}-`)?['Q100','Q101']:[]).map((id,index)=>({film:{value:`http://www.wikidata.org/entity/${id}`},links:{value:String(20-index)}}))}});
  if(url.hostname==='commons.wikimedia.org')return Response.json({query:{pages:[{title:'File:Fixture poster.jpg',imagerepository:'local',imageinfo:[{width:100,height:150,mime:'image/jpeg',thumburl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Fixture_poster.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Fixture_poster.jpg',extmetadata:{License:{value:'pd'},LicenseShortName:{value:'Public domain'},AttributionRequired:{value:'false'}}}]}]}});
  if(url.searchParams.get('list')==='search')return Response.json({query:{search:[]}});
  return Response.json({entities:Object.fromEntries((url.searchParams.get('ids')||'').split('|').map(id=>[id,{id,labels:{en:{value:`Fixture ${id}`}},claims:{P31:[value({id:'Q11424'})],P577:[value({time:`+${year}-01-01T00:00:00Z`,precision:11})],P3383:[value('Fixture poster.jpg')]}}]))});
 });
 try{
  const first=await new WikidataClient({fetcher,wikipediaPreview:false,persistence:new LocalDiscoveryCache(root)}).discover();
  const reads=()=>fetcher.mock.calls.filter(call=>new URL(String(call[0])).hostname!=='commons.wikimedia.org').length;
  const before=reads();const posters=fetcher.mock.calls.length-before;
  const second=await new WikidataClient({fetcher,wikipediaPreview:false,persistence:new LocalDiscoveryCache(root)}).discover();
  expect(second.results).toEqual(first.results);expect(second.results.map(movie=>movie.wikidataId)).toEqual(['Q100','Q101']);
  expect(reads()).toBe(before);expect(fetcher.mock.calls.length-reads()).toBe(posters+1);
 }finally{await rm(root,{recursive:true,force:true});}
});

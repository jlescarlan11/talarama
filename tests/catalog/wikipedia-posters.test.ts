// @vitest-environment node
import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {WikipediaPosters,localWikipediaPostersEnabled} from '@/app/lib/wikidata/wikipedia-posters';
const film={wikidataId:'Q109228991',title:'Dune: Part Two'};
const metadata={mime:'image/jpeg',extmetadata:{NonFree:{value:'true'},LicenseShortName:{value:'Fair use'},Artist:{value:'<b>Studio</b>'}}};
const page={title:film.title,pageprops:{wikibase_item:film.wikidataId},pageimage:'Dune Part Two poster.jpeg',thumbnail:{source:'https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg?utm_source=test',width:259,height:384}};
const transport=(override:Record<string,unknown>={})=>vi.fn<typeof fetch>(async input=>new URL(String(input)).searchParams.get('prop')==='imageinfo'?Response.json({query:{pages:[{title:'File:Dune Part Two poster.jpeg',imagerepository:'local',imageinfo:[metadata]}]}}):Response.json({query:{pages:[{...page,...override}]}}));
it('requires an explicit loopback preview setting',()=>{
 const settings={TALARAMA_WIKIPEDIA_POSTERS:'1',TALARAMA_LOCAL_PREVIEW:'wikidata',NEXTAUTH_URL:'http://127.0.0.1:3000'};
 expect(localWikipediaPostersEnabled(settings)).toBe(true);
 for(const override of [{TALARAMA_WIKIPEDIA_POSTERS:''},{TALARAMA_LOCAL_PREVIEW:''},{NEXTAUTH_URL:'https://example.com'},{NEXTAUTH_URL:'http://127.0.0.1.evil.invalid'}])expect(localWikipediaPostersEnabled({...settings,...override})).toBe(false);
});
it('returns a matched newer-film thumbnail with explicit preview-only copyrighted provenance',async()=>{
 const fetcher=transport();const result=await new WikipediaPosters({fetcher}).resolve([film]);
 expect(result.get(film.wikidataId)).toMatchObject({url:'https://upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg',license:'Copyrighted (Wikipedia)',previewOnly:true,sourceUrl:'https://en.wikipedia.org/wiki/File:Dune_Part_Two_poster.jpeg',artist:'Studio'});
 expect(fetcher).toHaveBeenCalledTimes(2);expect(fetcher.mock.calls[0][1]).toMatchObject({redirect:'error',cache:'no-store'});
});
it('rejects wrong Q IDs, cast photos, oversized thumbnails, unrelated filenames and external hosts',async()=>{
 for(const override of [{pageprops:{wikibase_item:'Q42'}},{pageimage:'Cast photograph.jpg'},{thumbnail:{...page.thumbnail,width:1000,height:1500}},{thumbnail:{...page.thumbnail,source:'https://upload.wikimedia.org/wikipedia/en/a/ab/Unrelated.jpg'}},{thumbnail:{...page.thumbnail,source:'https://evil.invalid/Dune_Part_Two_poster.jpeg'}}])expect((await new WikipediaPosters({fetcher:transport(override)}).resolve([film])).size).toBe(0);
});
it('fails softly, does not cache outages, bounds bodies and honors cooldown',async()=>{
 const fetcher=vi.fn<typeof fetch>(async()=>new Response('',{status:503}));const provider=new WikipediaPosters({fetcher});
 expect((await provider.resolve([film])).size).toBe(0);fetcher.mockImplementation(transport());expect((await provider.resolve([film])).size).toBe(1);
 for(const fetcher of [async()=>new Response('',{status:302}),async()=>Response.json({bad:true}),async()=>new Response('x',{headers:{'content-length':'99999999'}}),async()=>new Response(new Uint8Array(2*1024*1024+1))])expect((await new WikipediaPosters({fetcher}).resolve([film])).size).toBe(0);
 const rate=vi.fn<typeof fetch>(async()=>new Response('',{status:429}));const limited=new WikipediaPosters({fetcher:rate});await limited.resolve([film]);await limited.resolve([{wikidataId:'Q1',title:'Other'}]);expect(rate).toHaveBeenCalledOnce();
});
it('bounds stalled bodies and rejects unsafe titles without contacting an upstream',async()=>{
 const fetcher=vi.fn<typeof fetch>(async()=>new Response(new ReadableStream({start(){}})));const provider=new WikipediaPosters({fetcher});
 expect((await provider.resolve([{wikidataId:'Q1',title:'Bad|Title'}])).size).toBe(0);expect(fetcher).not.toHaveBeenCalled();
 vi.useFakeTimers();try{const result=provider.resolve([film]);await vi.advanceTimersByTimeAsync(8001);expect((await result).size).toBe(0);}finally{vi.useRealTimers();}
});

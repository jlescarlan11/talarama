// @vitest-environment node
import {expect,it,vi} from 'vitest';
vi.mock('server-only',()=>({}));
import {CommonsPosters} from '@/app/lib/wikidata/commons-posters';
const candidate={file:'Example film poster.jpg',explicitPoster:true};
const image=(overrides:Record<string,unknown>={})=>({title:'File:Example film poster.jpg',imagerepository:'local',imageinfo:[{width:1000,height:1500,mime:'image/jpeg',thumburl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Example_film_poster.jpg/500px-Example_film_poster.jpg?utm_source=test',descriptionurl:'https://commons.wikimedia.org/wiki/File:Example_film_poster.jpg',extmetadata:{LicenseShortName:{value:'Public domain'},License:{value:'pd'},AttributionRequired:{value:'false'},Artist:{value:'<b>Example artist</b>'},Credit:{value:'An original poster scan'},...overrides}}]});
const transport=(page=image())=>vi.fn<typeof fetch>(async()=>Response.json({query:{pages:[page]}}));
it('resolves an identity-linked public-domain poster with safe credit and bounded official requests',async()=>{
 const fetcher=transport();const resolver=new CommonsPosters({fetcher});
 const result=await resolver.resolve([candidate]);
 expect(result.get(candidate.file)).toMatchObject({url:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Example_film_poster.jpg/500px-Example_film_poster.jpg',sourceUrl:'https://commons.wikimedia.org/wiki/File:Example_film_poster.jpg',license:'Public domain',artist:'Example artist'});
 const url=new URL(String(fetcher.mock.calls[0][0]));expect(url.origin).toBe('https://commons.wikimedia.org');expect(url.searchParams.get('iiurlwidth')).toBe('480');expect(url.searchParams.get('titles')).toBe('File:Example film poster.jpg');
 expect(fetcher.mock.calls[0][1]).toMatchObject({redirect:'error',cache:'no-store'});
 await resolver.resolve([candidate]);expect(fetcher).toHaveBeenCalledOnce();
});
it('rejects nonfree, attribution-required, unknown-license, deleted, nonposter and nonimage results',async()=>{
 for(const metadata of [{LicenseShortName:{value:'Fair use'},License:{value:'fairuse'}},{AttributionRequired:{value:'true'}},{LicenseShortName:{value:'Unknown'},License:{value:'unknown'}},{NonFree:{value:'true'}},{DeletionReason:{value:'review pending'}}])expect((await new CommonsPosters({fetcher:transport(image(metadata))}).resolve([candidate])).size).toBe(0);
 const still=image();still.title='File:Cast photo.jpg';
 expect((await new CommonsPosters({fetcher:transport(still)}).resolve([{file:'Cast photo.jpg',explicitPoster:false}])).size).toBe(0);
 const svg=image();svg.imageinfo[0].mime='image/svg+xml';expect((await new CommonsPosters({fetcher:transport(svg)}).resolve([candidate])).size).toBe(0);
});
it('accepts CC0 and verified poster categories, refusing off-host media and file-page URLs',async()=>{
 const cc0=image({LicenseShortName:{value:'CC0'},License:{value:'cc-zero'},Categories:{value:'Film posters of 1920'}});cc0.title='File:Example.jpg';cc0.imageinfo[0].thumburl='https://upload.wikimedia.org/wikipedia/commons/a/ab/Example.jpg';cc0.imageinfo[0].descriptionurl='https://commons.wikimedia.org/wiki/File:Example.jpg';
 expect((await new CommonsPosters({fetcher:transport(cc0)}).resolve([{file:'Example.jpg',explicitPoster:false}])).size).toBe(1);
 for(const key of ['thumburl','descriptionurl']){const unsafe=image();unsafe.imageinfo[0][key as 'thumburl']='https://evil.invalid/image.jpg';expect((await new CommonsPosters({fetcher:transport(unsafe)}).resolve([candidate])).size).toBe(0);}
});
it('fails softly on outages, wrong files, redirect responses and malformed or oversized bodies',async()=>{
 for(const fetcher of [async()=>{throw Error('offline');},async()=>Response.json({unexpected:true}),async()=>new Response('',{status:302}),async()=>new Response('x',{headers:{'content-length':'999999999'}}),transport({...image(),title:'File:Wrong poster.jpg'})])expect((await new CommonsPosters({fetcher}).resolve([candidate])).size).toBe(0);
});
it('rejects unsafe filenames before network access and cools down on429',async()=>{
 const fetcher=vi.fn<typeof fetch>(async()=>new Response('',{status:429,headers:{'retry-after':'60'}}));const resolver=new CommonsPosters({fetcher});
 expect((await resolver.resolve([{file:'Bad|File.jpg',explicitPoster:true}])).size).toBe(0);expect(fetcher).not.toHaveBeenCalled();
 await resolver.resolve([candidate]);await resolver.resolve([{file:'Other poster.jpg',explicitPoster:true}]);expect(fetcher).toHaveBeenCalledOnce();
});
it('bounds streamed and stalled bodies and retries after an artwork-only failure',async()=>{
 expect((await new CommonsPosters({fetcher:async()=>new Response(new Uint8Array(2*1024*1024+1))}).resolve([candidate])).size).toBe(0);
 vi.useFakeTimers();
 try{
  const fetcher=vi.fn<typeof fetch>(async()=>new Response(new ReadableStream({start(){}})));
  const resolver=new CommonsPosters({fetcher});const result=resolver.resolve([candidate]);
  await vi.advanceTimersByTimeAsync(8001);expect((await result).size).toBe(0);
  fetcher.mockImplementation(transport());expect((await resolver.resolve([candidate])).size).toBe(1);
 }finally{vi.useRealTimers();}
});
it('rejects same-host thumbnails or source pages belonging to a different Commons file',async()=>{
 for(const key of ['thumburl','descriptionurl'] as const){
  const page=image();page.imageinfo[0][key]=key==='thumburl'?'https://upload.wikimedia.org/wikipedia/commons/a/ab/Unrelated.jpg':'https://commons.wikimedia.org/wiki/File:Unrelated.jpg';
  expect((await new CommonsPosters({fetcher:transport(page)}).resolve([candidate])).size).toBe(0);
 }
});

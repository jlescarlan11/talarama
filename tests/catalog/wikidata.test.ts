// @vitest-environment node
import { expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { WikidataClient } from '@/app/lib/wikidata/client';
import { movieHref } from '@/app/lib/movies/links';
const item = (id: string) => ({ mainsnak: { datavalue: { value: { id } } } });
export const entity = (id = 'Q25188') => ({ id, labels: { en: { value: 'Inception' } }, descriptions: { en: { value: '2010 film' } }, claims: { P31: [item('Q11424')], P136: [item('Q471839')], P57: [item('Q25191')], P161: [item('Q38111')], P577: [{ mainsnak: { datavalue: { value: { time: '+2010-07-08T00:00:00Z', precision: 11 } } } }], P2047: [{ mainsnak: { datavalue: { value: { amount: '+148', unit: 'http://www.wikidata.org/entity/Q7727' } } } }] } });
const transport = (main = entity()) => vi.fn<typeof fetch>(async input => {
  const url = new URL(String(input));
  if (url.hostname === 'query.wikidata.org') return Response.json({ results: { bindings: [{ film: { value: 'http://www.wikidata.org/entity/Q25188' } }] } });
  if (url.searchParams.get('list') === 'search') return Response.json({ query: { searchinfo: { totalhits: 1 }, search: [{ title: 'Q25188' }] } });
  if (url.searchParams.get('props') === 'labels') return Response.json({ entities: { Q471839: { id: 'Q471839', labels: { en: { value: 'science fiction film' } } }, Q25191: { id: 'Q25191', labels: { en: { value: 'Christopher Nolan' } } }, Q38111: { id: 'Q38111', labels: { en: { value: 'Leonardo DiCaprio' } } } } });
  return Response.json({ entities: { Q25188: main } });
});
it('normalizes real Q identities and metadata without inventing TMDB IDs, scores or image rights', async () => {
  const fetcher = transport(); const provider = new WikidataClient({ fetcher });
  const detail = await provider.details('Q25188');
  expect(detail).toMatchObject({ wikidataId: 'Q25188', tmdbId: null, title: 'Inception', releasedYear: 2010, duration: 148, posterUrl: null, tmdbScore: null, directors: [{ name: 'Christopher Nolan' }], cast: [{ name: 'Leonardo DiCaprio' }] });
  expect(movieHref(detail)).toBe('/movies/wikidata/Q25188');
  expect(fetcher.mock.calls[0][1]).toMatchObject({ redirect: 'error', cache: 'no-store', headers: { 'User-Agent': expect.stringContaining('Talarama') } });
  // Interactive reads may omit maxlag; a delayed query-service replica must not block entity reads.
  expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.has('maxlag')).toBe(false);
});
it('keeps literal title search, genre/year constraints and source-aware pagination', async () => {
  const fetcher = transport(); const provider = new WikidataClient({ fetcher });
  const result = await provider.search({ query: 'Inception', page: 1 });
  expect(result).toMatchObject({ source: 'wikidata', totalResults: 1, results: [{ wikidataId: 'Q25188' }] });
  expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get('srsearch')).toContain('inlabel:"Inception@en"');
  await provider.discover({ year: 2010, genre: 878 });
  const sparql = fetcher.mock.calls.map(call => new URL(String(call[0]))).find(url => url.hostname === 'query.wikidata.org')!;
  expect(sparql.searchParams.get('query')).toContain('Q471839');
  expect(sparql.searchParams.get('query')).toContain('2011-01-01');
});
it('rejects non-film entities, mismatched identity and unsafe external identifiers', async () => {
  const nonFilm = entity(); nonFilm.claims.P31 = [item('Q5')];
  await expect(new WikidataClient({ fetcher: transport(nonFilm) }).details('Q25188')).rejects.toMatchObject({ code: 'CONTENT_BLOCKED' });
  await expect(new WikidataClient({ fetcher: transport(entity('Q42')) }).details('Q25188')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
  await expect(new WikidataClient({ fetcher: transport() }).details('../Q42')).rejects.toMatchObject({ code: 'INVALID_INPUT' });
});
it('bounds title/year queries with literal search candidates instead of scanning every English label', async () => {
  const fetcher=transport();
  await new WikidataClient({fetcher}).search({query:'Inception',year:2010});
  const urls=fetcher.mock.calls.map(call=>new URL(String(call[0])));
  expect(urls[0].searchParams.get('srlimit')).toBe('100');
  expect(urls.find(url=>url.hostname==='query.wikidata.org')!.searchParams.get('query')).toContain('VALUES ?film { wd:Q25188 }');
});
it('fails closed on known adult metadata, redirects and oversized responses', async () => {
  const adult = entity(); adult.claims.P31 = [item('Q185529')];
  await expect(new WikidataClient({ fetcher: transport(adult) }).details('Q25188')).rejects.toMatchObject({ code: 'CONTENT_BLOCKED' });
  await expect(new WikidataClient({ fetcher: async () => new Response('x', { status: 302, headers: { location: 'https://elsewhere.invalid' } }) }).details('Q25188')).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  await expect(new WikidataClient({ fetcher: async () => new Response('x', { headers: { 'content-length': '999999999' } }) }).details('Q25188')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
it('honors upstream cooldown without another request and rejects malformed JSON', async () => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response('', { status: 429, headers: { 'retry-after': '60' } }));
  const provider = new WikidataClient({ fetcher });
  await expect(provider.details('Q25188')).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  await expect(provider.details('Q42')).rejects.toMatchObject({ code: 'RATE_LIMITED' });
  expect(fetcher).toHaveBeenCalledOnce();
  await expect(new WikidataClient({ fetcher: async () => Response.json({ unexpected: true }) }).details('Q25188')).rejects.toMatchObject({ code: 'INVALID_RESPONSE' });
});
it('bounds stalled response bodies and does not cache failed reads', async () => {
  vi.useFakeTimers();
  try {
    const fetcher=vi.fn<typeof fetch>(async()=>new Response(new ReadableStream({start(){}})));
    const provider=new WikidataClient({fetcher});
    const request=provider.details('Q25188');
    const assertion=expect(request).rejects.toMatchObject({code:'TIMEOUT'});
    await vi.advanceTimersByTimeAsync(20001);await assertion;
    fetcher.mockImplementation(transport());
    await expect(provider.details('Q25188')).resolves.toMatchObject({wikidataId:'Q25188'});
  } finally {vi.useRealTimers();}
});
it('never returns a regional re-release as its original release year', async () => {
  const main=entity();main.claims.P577.push({mainsnak:{datavalue:{value:{time:'+2009-12-31T00:00:00Z',precision:11}}}});
  expect((await new WikidataClient({fetcher:transport(main)}).discover({year:2010})).results).toEqual([]);
});
it('escapes literal operators and bounds bodies without a content-length header',async()=>{
 const fetcher=transport();const query='Movie " OR haswbstatement:P31=Q5 \\';
 await new WikidataClient({fetcher}).search({query});
 expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get('srsearch')).toContain(`inlabel:${JSON.stringify(query+'@en')}`);
 await expect(new WikidataClient({fetcher:async()=>new Response(new Uint8Array(8*1024*1024+1))}).details('Q25188')).rejects.toMatchObject({code:'INVALID_RESPONSE'});
});
it('uses a verified identity-linked Commons poster in both discovery and detail without changing IDs',async()=>{
 const main={...entity(),claims:{...entity().claims,P3383:[{mainsnak:{datavalue:{value:'Inception fixture poster.jpg'}}}]}};
 const original=transport(main);
 const fetcher=vi.fn<typeof fetch>(async(input,options)=>new URL(String(input)).hostname==='commons.wikimedia.org'?Response.json({query:{pages:[{title:'File:Inception fixture poster.jpg',imagerepository:'local',imageinfo:[{width:1000,height:1500,mime:'image/jpeg',thumburl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Inception_fixture_poster.jpg/500px-Inception_fixture_poster.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Inception_fixture_poster.jpg',extmetadata:{License:{value:'pd'},LicenseShortName:{value:'Public domain'},AttributionRequired:{value:'false'}}}]}]}}):original(input,options));
 const provider=new WikidataClient({fetcher});
 for(const movie of [(await provider.discover()).results[0],await provider.details('Q25188')])expect(movie).toMatchObject({wikidataId:'Q25188',tmdbId:null,posterUrl:'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Inception_fixture_poster.jpg/500px-Inception_fixture_poster.jpg',posterCredit:{license:'Public domain'}});
});
it('recovers artwork after a transient failure without refetching cached Wikidata metadata',async()=>{
 const main={...entity(),claims:{...entity().claims,P3383:[{mainsnak:{datavalue:{value:'Fixture poster.jpg'}}}]}};
 const original=transport(main);let failed=true;
 const fetcher=vi.fn<typeof fetch>(async(input,options)=>new URL(String(input)).hostname==='commons.wikimedia.org'?(failed?new Response('',{status:503}):Response.json({query:{pages:[{title:'File:Fixture poster.jpg',imagerepository:'local',imageinfo:[{width:1000,height:1500,mime:'image/jpeg',thumburl:'https://upload.wikimedia.org/wikipedia/commons/a/ab/Fixture_poster.jpg',descriptionurl:'https://commons.wikimedia.org/wiki/File:Fixture_poster.jpg',extmetadata:{License:{value:'pd'},LicenseShortName:{value:'Public domain'},AttributionRequired:{value:'false'}}}]}]}})):original(input,options));
 const provider=new WikidataClient({fetcher});
 expect((await provider.details('Q25188')).posterUrl).toBeNull();expect((await provider.discover()).results[0].posterUrl).toBeNull();const reads=original.mock.calls.length;
 failed=false;
 expect((await provider.details('Q25188')).posterUrl).toContain('wikimedia.org');expect((await provider.discover()).results[0].posterUrl).toContain('wikimedia.org');expect(original.mock.calls.length).toBe(reads);
});

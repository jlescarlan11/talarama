import 'server-only';
import { WikidataClient } from './client';
import {WikidataSync,localMovieSyncEnabled} from './sync';
import type {CatalogPage,WikidataMovie} from '@/app/lib/tmdb/types';
// Instrumentation, route handlers and RSC bundles share one process instance.
// No member records or copyrighted artwork are persisted by this cache.
const shared=globalThis as typeof globalThis & {talaramaWikidata?:{client:WikidataClient;sync:WikidataSync}};
const state=shared.talaramaWikidata??(()=>{const client=new WikidataClient();return {client,sync:new WikidataSync(id=>client.details(id))};})();
shared.talaramaWikidata=state;
export const movieSync=state.sync;
function observe(page:CatalogPage<WikidataMovie>){
 if(localMovieSyncEnabled())movieSync.remember(page.results.map(movie=>movie.wikidataId));
 // Discovery owns its ordered, verified-poster selection. A partial detail
 // refresh must not replace a verified card with a posterless cache entry.
 return page;
}
export const wikidata={
 details:(id:string)=>movieSync.details(id),
 search:async(input:Parameters<WikidataClient['search']>[0])=>observe(await state.client.search(input)),
 discover:async(input:Parameters<WikidataClient['discover']>[0]={})=>observe(await state.client.discover(input)),
};

import 'server-only';
import { WikidataClient } from './client';
import {WikidataSync,localMovieSyncEnabled} from './sync';
import {DiscoveryPrefetch} from './discovery-prefetch';
import {LocalDiscoveryCache,localDiscoveryDirectory} from './local-discovery-cache';
import type {CatalogPage,WikidataMovie} from '@/app/lib/tmdb/types';
// Instrumentation, route handlers and RSC bundles share one process instance.
// No member records or copyrighted artwork are persisted by this cache.
type SharedWikidata={client:WikidataClient;sync:WikidataSync;discovery?:DiscoveryPrefetch;persistence?:LocalDiscoveryCache};
const shared=globalThis as typeof globalThis & {talaramaWikidata?:SharedWikidata};
const state:SharedWikidata=shared.talaramaWikidata??(()=>{
 const directory=localDiscoveryDirectory();const persistence=directory?new LocalDiscoveryCache(directory):undefined;
 const client=new WikidataClient({persistence});return {client,sync:new WikidataSync(id=>client.details(id)),persistence};
})();
shared.talaramaWikidata=state;
const discovery=state.discovery??=new DiscoveryPrefetch(page=>state.client.discover({page}),{checkpoint:state.persistence});
export const movieSync=state.sync;
function observe(page:CatalogPage<WikidataMovie>){
 if(localMovieSyncEnabled())movieSync.remember(page.results.map(movie=>movie.wikidataId));
 // Discovery owns its ordered, verified-poster selection. A partial detail
 // refresh must not replace a verified card with a posterless cache entry.
 return page;
}
export const wikidata={
 // Warm the raw discovery cache without queuing unseen films for detailed casts.
 prefetchDiscovery:()=>localMovieSyncEnabled()?discovery.tick():Promise.resolve(undefined),
 details:(id:string)=>movieSync.details(id),
 search:async(input:Parameters<WikidataClient['search']>[0])=>observe(await state.client.search(input)),
 discover:async(input:Parameters<WikidataClient['discover']>[0]={})=>observe(await state.client.discover(input)),
};

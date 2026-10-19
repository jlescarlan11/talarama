import 'server-only';
import { unstable_cache } from 'next/cache';
import { WikidataClient } from './client';
const client = new WikidataClient();
const scope = process.env.TALARAMA_CACHE_SCOPE || 'provider';
export const wikidata = {
  discover:unstable_cache((input:Parameters<WikidataClient['discover']>[0]={})=>client.discover(input),['wikidata-normalized-v1',scope,'discover'],{revalidate:3600}),
  search:unstable_cache((input:Parameters<WikidataClient['search']>[0])=>client.search(input),['wikidata-normalized-v1',scope,'search'],{revalidate:300}),
  details:unstable_cache((id:string)=>client.details(id),['wikidata-normalized-v1',scope,'details'],{revalidate:86400}),
};

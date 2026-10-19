import 'server-only';
import { tmdb } from '@/app/lib/tmdb/server';
import { wikidata } from '@/app/lib/wikidata/server';
export const catalogSource = process.env.CATALOG_PROVIDER === 'tmdb' ? 'tmdb' : 'wikidata';
export const catalog = catalogSource === 'tmdb' ? tmdb : wikidata;

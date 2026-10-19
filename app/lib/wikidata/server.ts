import 'server-only';
import { WikidataClient } from './client';
// Metadata and Commons files have separate bounded, coalescing process caches.
// Do not Next-cache decorated responses: an artwork outage must remain retryable.
// A preview/test server owns its instance; no fixture data persists across runs.
export const wikidata = new WikidataClient();

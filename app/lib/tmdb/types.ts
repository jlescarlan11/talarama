export interface PosterCredit {url:string;sourceUrl:string;license:'Public domain'|'CC0';licenseUrl:string;artist:string;credit:string}
export interface CatalogMovie {
  localId: string | null;
  tmdbId: number;
  title: string;
  description: string | null;
  releasedYear: number | null;
  duration: number | null;
  posterUrl: string | null;
  posterCredit?: PosterCredit | null;
  backdropUrl: string | null;
  tmdbScore: number | null;
  tmdbVoteCount: number;
  genres: { tmdbId: number; name: string }[];
  cast: { tmdbId: number; name: string; character: string }[];
  directors: { tmdbId: number; name: string }[];
}
export type WikidataMovie = Omit<CatalogMovie, 'tmdbId' | 'tmdbVoteCount' | 'genres' | 'cast' | 'directors'> & {
  wikidataId: string; tmdbId: null; tmdbVoteCount: null;
  genres: { wikidataId: string; name: string }[];
  cast: { wikidataId: string; name: string; character: string }[];
  directors: { wikidataId: string; name: string }[];
};
export type DiscoveredMovie = CatalogMovie | WikidataMovie;
export interface CatalogPage<TMovie=DiscoveredMovie> { page: number; totalPages: number; totalResults: number; results: TMovie[]; source?: 'tmdb' | 'wikidata'; hasMore?: boolean; order?: 'coverage' | 'identifier' }
export type LocalCatalogMovie = Omit<CatalogMovie, 'localId' | 'tmdbId' | 'tmdbVoteCount'> & { localId: string; tmdbId: number | null; tmdbVoteCount: null };
export interface CatalogProvider {
  details(tmdbId: number): Promise<CatalogMovie>;
  search(input: { query: string; year?: number; page?: number }): Promise<CatalogPage<CatalogMovie>>;
}

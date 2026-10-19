export interface CatalogMovie {
  localId: string | null;
  tmdbId: number;
  title: string;
  description: string | null;
  releasedYear: number | null;
  duration: number | null;
  posterUrl: string | null;
  backdropUrl: string | null;
  tmdbScore: number | null;
  tmdbVoteCount: number;
  genres: { tmdbId: number; name: string }[];
  cast: { tmdbId: number; name: string; character: string }[];
  directors: { tmdbId: number; name: string }[];
}
export interface CatalogPage { page: number; totalPages: number; totalResults: number; results: CatalogMovie[] }
export type LocalCatalogMovie = Omit<CatalogMovie, 'localId' | 'tmdbId' | 'tmdbVoteCount'> & { localId: string; tmdbId: number | null; tmdbVoteCount: null };
export interface CatalogProvider {
  details(tmdbId: number): Promise<CatalogMovie>;
  search(input: { query: string; year?: number; page?: number }): Promise<CatalogPage>;
}

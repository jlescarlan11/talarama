// constants/movieConstants.ts
import { SortOption } from "../types/movie";

export interface SortOptionConfig {
  value: SortOption | "";
  label: string;
  group?: string;
}

export const SORT_OPTIONS: SortOptionConfig[] = [
  { value: "", label: "Default (A-Z)" },
  { value: "title-asc", label: "Title (A-Z)", group: "Title" },
  { value: "title-desc", label: "Title (Z-A)", group: "Title" },
  { value: "dateAdded-desc", label: "Recently Added", group: "Date Added" },
  { value: "dateAdded-asc", label: "Oldest First", group: "Date Added" },
  {
    value: "releasedYear-desc",
    label: "Newest Released",
    group: "Release Year",
  },
  {
    value: "releasedYear-asc",
    label: "Oldest Released",
    group: "Release Year",
  },
];

export const DEFAULT_GENRE_OPTION = {
  value: "all",
  label: "All Genres",
};

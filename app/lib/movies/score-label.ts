export function scoreLabel(movie:{tmdbScore:number|null;wikidataId?:string}) {
  if(movie.wikidataId)return 'Wikidata';
  return movie.tmdbScore===null?'TMDB: not rated':`TMDB ${movie.tmdbScore.toFixed(1)}/10`;
}

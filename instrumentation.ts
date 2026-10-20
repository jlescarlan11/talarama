export async function register(){
 if(process.env.NEXT_RUNTIME==='nodejs'){
  const {localMovieSyncEnabled}=await import('./app/lib/wikidata/sync');
  if(localMovieSyncEnabled()){
   const {startLocalMovieSync}=await import('./app/services/movieSyncService');
   startLocalMovieSync();
  }
 }
}

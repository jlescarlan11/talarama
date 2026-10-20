'use client';
import {useEffect,useTransition} from 'react';
import {usePathname,useRouter} from 'next/navigation';
import {movieMetadataRefreshEvent,moviePageRefreshMs} from '@/app/lib/movies/refresh';

/** Soft updates preserve React state, URL controls and browser scroll/focus. */
export default function LocalMovieAutoRefresh({enabled}:{enabled:boolean}){
 const pathname=usePathname();const router=useRouter();const [pending,startTransition]=useTransition();
 useEffect(()=>{
  const publicPage=pathname==='/community'||pathname.startsWith('/members/')||pathname.startsWith('/reviews/');
  const moviePage=pathname==='/'||pathname==='/movies'||(pathname.startsWith('/movies/')&&!pathname.startsWith('/movies/edit/')&&pathname!=='/movies/new')||pathname==='/diaries'||pathname.startsWith('/diaries/');
  if(!enabled||(!moviePage&&!publicPage))return;
  let lastRefresh=Date.now();
  const refresh=()=>{
   if(Date.now()-lastRefresh<moviePageRefreshMs||document.visibilityState!=='visible'||!navigator.onLine||pending||document.querySelector('[aria-busy="true"]'))return;
   lastRefresh=Date.now();window.dispatchEvent(new Event(movieMetadataRefreshEvent));
   // These client resources own their reads and retain their URL/cursor state.
   if(pathname!=='/movies'&&!publicPage)startTransition(()=>router.refresh());
  };
  const timer=setInterval(refresh,moviePageRefreshMs);
  document.addEventListener('visibilitychange',refresh);window.addEventListener('focus',refresh);window.addEventListener('online',refresh);
  return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);window.removeEventListener('focus',refresh);window.removeEventListener('online',refresh);};
 },[enabled,pathname,router,pending,startTransition]);
 return null;
}

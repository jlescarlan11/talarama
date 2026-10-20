'use client';
import { useEffect, useState } from 'react';
import type { CatalogPage } from '@/app/lib/tmdb/types';
import {movieMetadataRefreshEvent} from '@/app/lib/movies/refresh';

export type CatalogInitial = { key: string; data: CatalogPage | null; error: string | null } | null;
/** Key every result to its URL and ignore obsolete work even if abort is ignored. */
export function useCatalogSearch(key: string, initial: CatalogInitial) {
  const [result, setResult] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    let pending:AbortController|null=null;
    const load=async(silent=false)=>{
      if(pending)return;
      const controller=new AbortController();pending=controller;
      try{
        const response=await fetch(`/api/catalog?${key}`, {cache:'no-store',signal:controller.signal});
        if(!response.ok)throw Error();
        const data:CatalogPage=await response.json();
        if(active)setResult({key,data,error:null});
      }catch{
        if(active)setResult(previous=>silent&&previous?.key===key&&previous.data?previous:{key,data:null,error:'Movie provider is unavailable. Please try again.'});
      }finally{if(pending===controller)pending=null;}
    };
    const refresh=()=>{void load(true);};
    if(!(attempt===0&&initial?.key===key))void load();
    window.addEventListener(movieMetadataRefreshEvent,refresh);
    return()=>{active=false;pending?.abort();window.removeEventListener(movieMetadataRefreshEvent,refresh);};
  }, [key, attempt, initial]);
  const current = result?.key === key ? result : initial?.key === key && attempt === 0 ? initial : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: !current, retry: () => { setResult(null); setAttempt(x => x + 1); } };
}

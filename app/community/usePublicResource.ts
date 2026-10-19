'use client';
import {useMemo,useSyncExternalStore} from 'react';
import {publicationEvent} from '@/app/lib/community/refresh';
/** Never hydrate previously cached public content. Re-check on every resume/focus/privacy event. */
const loading={data:null,error:null,missing:false};
function resource<T>(url:string){
 let state:{data:T|null;error:string|null;missing:boolean}=loading;
 let pending:AbortController|null=null;
 const listeners=new Set<()=>void>();
 const setState=(value:typeof state)=>{state=value;listeners.forEach(fn=>fn());};
 const refresh=async()=>{
  pending?.abort();const controller=new AbortController();pending=controller;
  setState(loading);
  try{
   const response=await fetch(url,{cache:'no-store',signal:controller.signal});
   if(controller.signal.aborted)return;
   if(response.status===404){setState({data:null,error:null,missing:true});return;}
   const data=await response.json();if(!response.ok)throw Error(data.error??'Could not load this page.');
   if(!controller.signal.aborted)setState({data,error:null,missing:false});
  }catch(error){if(!controller.signal.aborted)setState({data:null,error:error instanceof Error?error.message:'Could not load this page.',missing:false});}
 };
 const reload=()=>{void refresh();};
 const visibility=()=>{if(document.visibilityState==='visible')reload();else{pending?.abort();setState(loading);}};
 const storage=(event:StorageEvent)=>{if(event.key===publicationEvent)reload();};
 return {refresh,getSnapshot:()=>state,getServerSnapshot:()=>loading,subscribe:(listener:()=>void)=>{
  listeners.add(listener);
  if(listeners.size===1){reload();window.addEventListener('focus',reload);window.addEventListener('pageshow',reload);window.addEventListener(publicationEvent,reload);window.addEventListener('storage',storage);document.addEventListener('visibilitychange',visibility);}
  return()=>{listeners.delete(listener);if(!listeners.size){pending?.abort();state=loading;window.removeEventListener('focus',reload);window.removeEventListener('pageshow',reload);window.removeEventListener(publicationEvent,reload);window.removeEventListener('storage',storage);document.removeEventListener('visibilitychange',visibility);}};
 }};
}
export function usePublicResource<T>(url:string){
 const store=useMemo(()=>resource<T>(url),[url]);
 const state=useSyncExternalStore(store.subscribe,store.getSnapshot,store.getServerSnapshot);
 return {...state,refresh:store.refresh};
}

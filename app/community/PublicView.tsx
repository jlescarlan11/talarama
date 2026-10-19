'use client';
import {useState} from 'react';
import Link from 'next/link';
import type {PublicEntry} from '@/app/services/publicEntryService';
import {usePublicResource} from './usePublicResource';
import EntryCard,{Avatar} from './EntryCard';
import {movieHref} from '@/app/lib/movies/links';
interface PageData {entries:PublicEntry[];nextCursor:string|null;rating?:{average:number|null;count:number};username?:string;name?:string|null;bio?:string;image?:string|null;statistics?:{logs:number;movies:number};favorites?:{id:string;tmdbId:number|null;title:string}[]}
export default function PublicView({endpoint,kind}:{endpoint:string;kind:'feed'|'profile'|'review'|'movie'}){
 const [cursor,setCursor]=useState<string|null>(null);
 // Report drafts belong to the page, outside content discarded during eligibility rechecks.
 const [reportDrafts,setReportDrafts]=useState<Record<string,string>>({});
 const onReportDraftChange=(key:string,value:string)=>setReportDrafts(previous=>({...previous,[key]:value}));
 const url=cursor?`${endpoint}?cursor=${encodeURIComponent(cursor)}`:endpoint;
 const {data,error,missing,refresh}=usePublicResource<PageData|PublicEntry>(url);
 if(missing)return <section className="py-8"><h1 className="text-2xl font-bold">Not found</h1><p>This page is unavailable.</p></section>;
 if(error)return <section role="alert" className="space-y-3"><p>{error}</p><button className="btn btn-outline" onClick={()=>void refresh()}>Try again</button></section>;
 if(!data)return <p role="status">Checking public availability…</p>;
 if(kind==='review')return <div className="max-w-[48rem] mx-auto space-y-5"><h1 className="text-3xl font-bold">Member review</h1><EntryCard key={(data as PublicEntry).id} entry={data as PublicEntry} reportDrafts={reportDrafts} onReportDraftChange={onReportDraftChange} full/></div>;
 const page=data as PageData;
 return <section className="max-w-[48rem] mx-auto space-y-6" aria-label={kind==='movie'?'Community reviews':undefined}>
  {kind==='profile'&&<header className="space-y-4"><div className="flex items-center gap-4"><Avatar image={page.image??null} name={page.name||page.username||'Member'}/><div><h1 className="text-3xl font-bold break-words">{page.name||page.username}</h1><p>@{page.username}</p></div></div>{page.bio&&<p className="whitespace-pre-wrap break-words">{page.bio}</p>}<p>{page.statistics?.logs} public logs · {page.statistics?.movies} distinct public movie{page.statistics?.movies===1?'':'s'}</p>{!!page.favorites?.length&&<section className="space-y-2"><h2 className="text-xl font-bold">Favorite movies</h2><ul className="flex flex-wrap gap-3">{page.favorites.map(movie=><li key={movie.id}><Link className="link" href={movieHref({localId:movie.id,tmdbId:movie.tmdbId})}>{movie.title}</Link></li>)}</ul></section>}</header>}
  {kind==='movie'&&<header className="space-y-2"><h2 className="text-2xl font-bold">Community reviews</h2><p className="font-semibold">{page.rating?.average==null?'Talarama: not rated':`Talarama ${page.rating.average.toFixed(1)}/5`}</p><p className="text-sm text-base-content/70">{page.rating?.count??0} member{page.rating?.count===1?'':'s'} · Each member’s newest eligible rating counts once.</p></header>}
  {page.entries.length?<div className="space-y-4">{page.entries.map(entry=><EntryCard key={entry.id} entry={entry} reportDrafts={reportDrafts} onReportDraftChange={onReportDraftChange}/>)}</div>:<div className="rounded-xl bg-base-200 p-6 space-y-3"><h2 className="font-bold text-xl">{kind==='feed'?'No public activity yet':kind==='movie'?'No written reviews yet':'No public viewings yet'}</h2><p>{kind==='movie'?'Ratings can be shared without a written review.':'Discover a movie, log a viewing and choose what to publish from your profile settings.'}</p><Link className="link" href="/movies">Discover movies</Link></div>}
  <div className="flex gap-3">{cursor&&<button className="btn btn-outline" onClick={()=>setCursor(null)}>Newest</button>}{page.nextCursor&&<button className="btn btn-outline" onClick={()=>setCursor(page.nextCursor)}>Older activity</button>}</div>
 </section>;
}

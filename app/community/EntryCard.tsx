'use client';
import Link from 'next/link';
import Image from 'next/image';
import {useState} from 'react';
import {useSession,signIn} from 'next-auth/react';
import type {PublicEntry} from '@/app/services/publicEntryService';
import {movieHref} from '@/app/lib/movies/links';
function Avatar({image,name}:{image:string|null;name:string}){
 const [failed,setFailed]=useState(false);
 const safe=image && (image.startsWith('/')&&!image.startsWith('//') || /^https:\/\/lh3\.googleusercontent\.com\//.test(image));
 return safe&&!failed?<Image src={image!} width={40} height={40} alt="" className="rounded-full w-10 h-10 object-cover" onError={()=>setFailed(true)}/>:<span aria-hidden="true" className="rounded-full bg-base-300 grid place-items-center w-10 h-10 shrink-0 font-bold">{name.slice(0,1).toUpperCase()}</span>;
}
export {Avatar};
export default function EntryCard({entry,full=false,reportDrafts,onReportDraftChange}:{entry:PublicEntry;full?:boolean;reportDrafts:Record<string,string>;onReportDraftChange:(key:string,value:string)=>void}){
 const {status,data:session}=useSession();const [message,setMessage]=useState('');const [pending,setPending]=useState(false);
 const draftKey=`${session?.user?.id??'anonymous'}:${entry.id}`;
 const reason=reportDrafts[draftKey]??'';
 const setReason=(value:string)=>onReportDraftChange(draftKey,value);
 const name=entry.user.name||entry.user.username||'Member';
 const text=full?entry.review:entry.review.length>350?entry.review.slice(0,350)+'…':entry.review;
 async function report(event:React.FormEvent){event.preventDefault();setPending(true);setMessage('');try{const response=await fetch(`/api/reviews/${encodeURIComponent(entry.id)}/reports`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reason})});const data=await response.json();if(!response.ok)throw Error(data.error);setMessage('Report received. Thank you.');}catch(error){setMessage(error instanceof Error?error.message:'Could not send report.');}finally{setPending(false);}}
 return <article className="rounded-xl border border-base-300 bg-base-100 p-4 sm:p-6 space-y-4 break-words">
  <div className="flex gap-3 items-center"><Avatar image={entry.user.image} name={name}/><div className="min-w-0"><Link prefetch={false} className="link font-semibold" href={`/members/${encodeURIComponent(entry.user.username??'')}`}>{name}</Link><p className="text-sm text-base-content/70">@{entry.user.username} · <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleDateString('en',{year:'numeric',month:'short',day:'numeric',timeZone:'UTC'})}</time></p></div></div>
  <div><Link className="link font-bold text-lg" href={movieHref({localId:entry.movie.id,tmdbId:entry.movie.tmdbId})}>{entry.movie.title}</Link><p className="text-sm">{entry.rating===null?'Logged a viewing · Not rated':`Rated ${entry.rating}/5`}{entry.isRewatch?' · Rewatch':''}</p></div>
  {entry.review?(entry.containsSpoilers?<details className="rounded-lg border border-base-300 p-3"><summary className="cursor-pointer font-semibold focus-ring">Reveal spoiler</summary><p className="mt-3 whitespace-pre-wrap leading-relaxed">{text}</p></details>:<p className="whitespace-pre-wrap leading-relaxed">{text}</p>):<p className="text-base-content/70 text-sm">A viewing shared without a written review.</p>}
  {!!entry.review&&<div className="flex flex-wrap gap-4 items-start"><Link prefetch={false} className="link text-sm" href={`/reviews/${encodeURIComponent(entry.id)}`}>{full?'Permalink':'Read review'}</Link>
   <details className="text-sm grow"><summary className="cursor-pointer link focus-ring w-fit">Report review</summary>{status==='authenticated'?<form onSubmit={report} aria-busy={pending} className="space-y-3 mt-3"><label className="block">Report reason<textarea className="textarea w-full block mt-2" value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} required rows={3}/></label><p>{reason.length}/500 characters · One report per member and review</p><button className="btn btn-outline btn-sm" disabled={pending||message.startsWith('Report received')}>{pending?'Sending…':'Submit report'}</button>{message&&<p role="status">{message}</p>}</form>:<button className="btn btn-outline mt-3" onClick={()=>signIn('google',{callbackUrl:`/reviews/${entry.id}`})}>Sign in to report</button>}</details></div>}
 </article>;
}

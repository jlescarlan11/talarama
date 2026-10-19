"use client";
import {useState} from 'react';
import {useRouter} from 'next/navigation';
import type {DiaryEntryWithMovie} from './types/diary';
import DiaryDialog from './DiaryDialog';
export default function DiaryEntryDeleteButton({entry,onClose}:{entry:DiaryEntryWithMovie;onClose:()=>void}) {
 const router=useRouter();const [pending,setPending]=useState(false);const [error,setError]=useState(false);
 async function remove(){setPending(true);setError(false);try{const response=await fetch(`/api/diaries/${encodeURIComponent(entry.id)}`,{method:'DELETE'});if(!response.ok)throw Error();onClose();router.refresh();}catch{setError(true);setPending(false);}}
 return <DiaryDialog title="Delete diary entry" onClose={()=>{if(!pending)onClose();}}><h2 className="text-xl font-bold">Delete Diary Entry</h2><p className="py-4 break-words">Delete your viewing of {entry.movie.title}? This removes its review and rating. It does not restore a watchlist item.</p>{error&&<p role="alert" className="text-error">Could not delete this entry. Please retry.</p>}<div className="modal-action"><button className="btn" autoFocus disabled={pending} onClick={onClose}>Cancel</button><button className="btn btn-error" disabled={pending} onClick={remove}>{pending?'Deleting...':'Delete Entry'}</button></div></DiaryDialog>;
}

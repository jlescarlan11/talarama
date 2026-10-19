"use client";
import {useEffect,useRef,type ReactNode} from 'react';
export default function DiaryDialog({title,onClose,children}:{title:string;onClose:()=>void;children:ReactNode}) {
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const element=ref.current;element?.showModal();return()=>element?.close();},[]);
 return <dialog ref={ref} className="modal" aria-label={title} onCancel={event=>{event.preventDefault();onClose();}}><div className="modal-box w-[calc(100%-2rem)] max-w-[40rem]">{children}</div><form method="dialog" className="modal-backdrop"><button onClick={onClose}>Close</button></form></dialog>;
}

'use client';
export const publicationEvent='talarama-publication-change';
export function announcePublicationChange(){
 window.dispatchEvent(new Event(publicationEvent));
 try{localStorage.setItem(publicationEvent,`${Date.now()}-${Math.random()}`);}catch{/* Current-window refresh still works. */}
}

"use client";
import { useState,useRef,useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDiaryForm } from '../_hooks/useDiaryForm';
import StarRating from '../new/StarRating';
import type { Movie,DiaryEntryWithMovie } from '../types/diary';
export default function DiaryForm(props:{movies:Movie[];diary?:DiaryEntryWithMovie;initialMovie?:Movie|null}) {
 const {form,selectedMovie,isSubmitting,timeZone,watchedFields,handleRatingChange,handleSubmit}=useDiaryForm(props);
 const {register,formState:{errors}}=form;
 const router=useRouter();const [query,setQuery]=useState('');const errorRef=useRef<HTMLParagraphElement>(null);
 useEffect(()=>{if(errors.root)errorRef.current?.focus();},[errors.root]);
 const movies=props.movies.filter(m=>m.id===watchedFields.movieId||m.title.toLowerCase().includes(query.toLowerCase()));
 return <section className="max-w-[48rem] mx-auto py-6 space-y-6">
  <h1 className="text-3xl font-bold">{props.diary?'Edit your film diary':'Log a viewing'}</h1>
  <form className="space-y-6 rounded-xl border border-base-300 p-4 sm:p-6 bg-base-200" onSubmit={form.handleSubmit(handleSubmit)} aria-busy={isSubmitting}>
   <fieldset disabled={isSubmitting} className="space-y-5 min-w-0">
    <legend className="sr-only">Diary details</legend>
    <div className="space-y-2"><label className="block font-semibold" htmlFor="movie-query">Find a saved movie</label><input id="movie-query" className="input w-full" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filter saved titles"/>
     <label className="block font-semibold" htmlFor="diary-movie">Movie</label><select id="diary-movie" {...register('movieId')} className="select w-full" aria-invalid={!!errors.movieId} aria-describedby="movie-help"><option value="">Choose a movie</option>{movies.map(m=><option key={m.id} value={m.id}>{m.title}{m.releasedYear?` (${m.releasedYear})`:''}</option>)}</select>
     <p id="movie-help" className="text-sm">{errors.movieId?.message??'Choose a local title, or discover another movie.'} <Link className="link" href="/movies">Discover movies</Link></p>
    </div>
    {selectedMovie&&<p className="font-medium break-words">Logging: {selectedMovie.title}</p>}
    <div className="space-y-2"><label className="block font-semibold" htmlFor="watched-date">Watched Date</label><input id="watched-date" type="date" {...register('watchedDate')} className="input w-full" aria-invalid={!!errors.watchedDate} aria-describedby="date-help"/>
     <p id="date-help" className={errors.watchedDate?'text-error':'text-sm text-base-content/70'}>{errors.watchedDate?.message??`Calendar date in ${timeZone??'your saved timezone (loading...)'}. It displays the same in every timezone.`}</p></div>
    <StarRating rating={watchedFields.rating} onRatingChange={handleRatingChange} error={errors.rating?.message}/>
    <div className="space-y-2"><label className="block font-semibold" htmlFor="diary-review">Review (optional)</label><textarea id="diary-review" {...register('review')} maxLength={2000} rows={6} className="textarea w-full" aria-invalid={!!errors.review} aria-describedby="review-help"/><p id="review-help" className="text-sm">{errors.review?.message??`${watchedFields.review.length}/2000 characters`}</p></div>
    <label className="flex gap-3 items-center"><input type="checkbox" {...register('isRewatch')} className="checkbox"/>Rewatch</label>
    <label className="flex gap-3 items-center"><input type="checkbox" {...register('containsSpoilers')} className="checkbox"/>Contains spoilers</label>
    <div className="space-y-2"><label className="block font-semibold" htmlFor="diary-visibility">Visibility</label><select id="diary-visibility" {...register('visibility')} className="select w-full" aria-describedby="visibility-help"><option value="PRIVATE">Private</option><option value="PUBLIC">Public intent</option></select>
     <p id="visibility-help" className="text-sm text-base-content/70">Private is just for you. Public intent is saved, but nothing is published until profile publication and community controls launch. Your profile must also be published then.</p></div>
    <p className="rounded-lg border border-base-300 p-3 text-sm">Saving a viewing removes this movie from your watchlist. Favorites stay separate. Deleting a viewing does not put it back on your watchlist.</p>
   </fieldset>
   {errors.root&&<p ref={errorRef} tabIndex={-1} role="alert" className="text-error break-words">{errors.root.message}</p>}
   <div className="flex flex-wrap justify-end gap-3"><button type="button" className="btn btn-ghost" disabled={isSubmitting} onClick={()=>router.back()}>Cancel</button><button className="btn btn-primary" type="submit" disabled={isSubmitting}>{isSubmitting?'Saving...':props.diary?'Update Entry':'Save Entry'}</button></div>
  </form>
 </section>;
}

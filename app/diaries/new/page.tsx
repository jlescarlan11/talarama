import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import authOptions from '@/app/auth/authOptions';
import prisma from '@/prisma/client';
import DiaryForm from '../_components/DiaryForm';
import {syncMovieDisplays} from '@/app/services/movieSyncService';
export default async function NewDiaryPage({searchParams}:{searchParams:Promise<{movieId?:string}>}) {
 const {movieId}=await searchParams;
 const session=await getServerSession(authOptions);
 if(!session?.user?.id)redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent('/diaries/new'+(movieId?'?'+new URLSearchParams({movieId}):''))}`);
 const movies=await syncMovieDisplays(await prisma.movie.findMany({orderBy:{title:'asc'}}));
 return <DiaryForm movies={movies} initialMovie={movies.find(movie=>movie.id===movieId)??null}/>;
}

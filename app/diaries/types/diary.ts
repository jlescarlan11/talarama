import type { Movie as PrismaMovie,DiaryEntry } from '@prisma/client';
export type Movie = Pick<PrismaMovie,'id'|'title'|'description'|'releasedYear'|'duration'|'posterUrl'|'directorFirstName'|'directorLastName'|'createdAt'> & {tmdbId?:number|null};
export type { DiaryInput as DiaryFormData } from '@/app/lib/diary/contracts';
export type DiaryEntryWithMovie = DiaryEntry & {movie:Movie};

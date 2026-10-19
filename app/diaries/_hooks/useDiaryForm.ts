import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { diaryEntrySchema, type DiaryInput } from '@/app/lib/diary/contracts';
import { calendarDate, todayInTimeZone, validateWatchedDate, isTimeZone } from '@/app/lib/diary/dates';
import type { Movie, DiaryEntryWithMovie } from '../types/diary';
import { diaryService } from '../diaryService';
interface Props {
    movies: Movie[];
    diary?: DiaryEntryWithMovie;
    initialMovie?: Movie | null;
}
export function useDiaryForm({ movies, diary, initialMovie }: Props) {
    const router = useRouter();
    const [requestId] = useState(() => crypto.randomUUID());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timeZone, setTimeZone] = useState<string | null>(null);
    const attemptedCreate = useRef<DiaryInput | null>(null);
    const [recoveredEntryId, setRecoveredEntryId] = useState<string | null>(null);
    const initialization = useRef<Promise<string> | null>(null);
    const form = useForm<DiaryInput>({ resolver: zodResolver(diaryEntrySchema), defaultValues: {
            movieId: diary?.movieId ?? initialMovie?.id ?? '', watchedDate: diary ? calendarDate(diary.watchedDate) : todayInTimeZone('UTC'), rating: diary?.rating ?? null, review: diary?.review ?? '', isRewatch: diary?.isRewatch ?? false, containsSpoilers: diary?.containsSpoilers ?? false, visibility: diary?.visibility ?? 'PRIVATE', clientRequestId: diary?.clientRequestId ?? requestId,
        } });
    const { setValue, getFieldState } = form;
    const initializeTimeZone = useCallback(() => {
        if (!initialization.current) {
            const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const zone = browser && isTimeZone(browser) ? browser : 'UTC';
            const pending = fetch('/api/diary-timezone', {
                method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ timeZone: zone }),
            }).then(async response => {
                if (!response.ok) throw new Error('Could not load your saved timezone. Your draft is here; please try Save again.');
                return (await response.json()).timeZone as string;
            });
            initialization.current = pending;
            // Keep pending calls coalesced, but never retain a failed request as the next retry.
            pending.catch(() => { if (initialization.current === pending) initialization.current = null; });
        }
        return initialization.current;
    }, []);
    useEffect(() => {
        let active = true;
        initializeTimeZone().then(saved => {
            if (active) {
                setTimeZone(saved);
                if (!diary && !getFieldState('watchedDate').isDirty) setValue('watchedDate', todayInTimeZone(saved));
            }
        }).catch(() => { /* Save retries initialization without discarding this form. */ });
        return () => { active = false; };
    }, [diary, setValue, getFieldState, initializeTimeZone]);
    const watchedFields = form.watch();
    const selectedMovie = movies.find(movie => movie.id === watchedFields.movieId) ?? null;
    async function handleSubmit(data: DiaryInput) {
        if (isSubmitting)
            return;
        setIsSubmitting(true);
        form.clearErrors('root');
        try {
            const zone = await initializeTimeZone();
            setTimeZone(zone);
            if (!validateWatchedDate(data.watchedDate, zone)) {
                form.setError('watchedDate', { message: 'Watched date cannot be in the future in your saved timezone' }, { shouldFocus: true });
                setIsSubmitting(false);
                return;
            }
            const payload = diaryEntrySchema.parse({ ...data, review: data.review.trim(), clientRequestId: diary?.clientRequestId ?? requestId });
            const editId = diary?.id ?? recoveredEntryId;
            if (editId) {
                await diaryService.updateEntry(editId, payload);
            } else {
                // Recover exactly the first submitted operation before acting on later edits.
                attemptedCreate.current ??= payload;
                const saved = await diaryService.createEntry(attemptedCreate.current);
                if (JSON.stringify(payload) !== JSON.stringify(attemptedCreate.current)) {
                    if (!saved || typeof saved.id !== 'string') throw new Error('Could not recover the saved viewing. Please retry.');
                    setRecoveredEntryId(saved.id);
                    form.setError('root', { message: 'Your submitted viewing is saved. Your latest changes are still here. Choose Update Entry to apply them to that viewing.' });
                    setIsSubmitting(false);
                    return;
                }
            }
            router.push('/diaries');
            router.refresh();
        }
        catch (error) {
            setIsSubmitting(false);
            form.setError('root', { message: diaryService.getErrorMessage(error) });
        }
    }
    return { form, selectedMovie, isSubmitting, timeZone, isEditMode: !!diary || !!recoveredEntryId, watchedFields, handleMovieSelect: (movie: Movie) => setValue('movieId', movie.id, { shouldValidate: true }), handleRatingChange: (rating: number | null) => setValue('rating', rating, { shouldValidate: true }), handleSubmit };
}

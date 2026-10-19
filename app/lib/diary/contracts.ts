import { z } from 'zod';
import { parseCalendarDate } from './dates';
export const diaryEntrySchema = z.object({
    movieId: z.string().min(1, 'Choose a movie').max(200),
    watchedDate: z.string().refine(value => !!parseCalendarDate(value), 'Enter a valid calendar date'),
    rating: z.number().int().min(1).max(5).nullable(),
    review: z.string().trim().max(2000),
    isRewatch: z.boolean(), containsSpoilers: z.boolean(),
    visibility: z.enum(['PRIVATE', 'PUBLIC']),
    clientRequestId: z.string().uuid(),
}).strict();
export type DiaryInput = z.infer<typeof diaryEntrySchema>;

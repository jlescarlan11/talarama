import 'server-only';
import { ZodError } from 'zod';
import { DiaryError } from '@/app/services/diaryEntryService';
export { json } from '@/app/lib/movies/http';
import { json } from '@/app/lib/movies/http';
import {RateLimitError} from '@/app/lib/rateLimit';
import {communityError} from '@/app/lib/community/http';
export function diaryError(error: unknown) {
    if(error instanceof RateLimitError)return communityError(error);
    if (error instanceof DiaryError)
        return json({ error: error.message }, error.status);
    if (error instanceof ZodError)
        return json({ error: 'Check the diary fields', details: error.flatten() }, 400);
    return json({ error: 'Could not save your diary. Please try again.' }, 500);
}
export async function readDiaryBody(request: Request) {
    try {
        return await request.json();
    }
    catch {
        throw new DiaryError('Invalid JSON', 400);
    }
}

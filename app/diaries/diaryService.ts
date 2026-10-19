import type { DiaryInput } from '@/app/lib/diary/contracts';
async function save(url: string, method: string, payload: DiaryInput) {
    const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const body = await response.json();
    if (!response.ok)
        throw new Error(typeof body.error === 'string' ? body.error : 'Could not save. Please retry.');
    return body;
}
export const diaryService = {
    createEntry: (payload: DiaryInput) => save('/api/diaries', 'POST', payload),
    updateEntry: (id: string, payload: DiaryInput) => save(`/api/diaries/${encodeURIComponent(id)}`, 'PATCH', payload),
    getErrorMessage: (error: unknown) => error instanceof Error ? error.message : 'Network error. Your draft is still here. Please retry.',
};

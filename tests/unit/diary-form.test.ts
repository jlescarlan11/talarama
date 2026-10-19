import { renderHook, act } from '@testing-library/react';
import { vi, it, expect } from 'vitest';
import { useDiaryForm } from '@/app/diaries/_hooks/useDiaryForm';
import { diaryService } from '@/app/diaries/diaryService';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/app/diaries/diaryService', () => ({ diaryService: { createEntry: vi.fn(), updateEntry: vi.fn(), getErrorMessage: () => 'Failed' } }));
it('submits the field names consumed by the diary API', async () => {
  const { result } = renderHook(() => useDiaryForm({ movies: [] }));
  await act(() => result.current.handleSubmit({ movieId: 'movie-1', rating: 4, review: '  A film  ', watchedDate: '2020-01-02' }));
  expect(diaryService.createEntry).toHaveBeenCalledWith({ movieId: 'movie-1', rating: 4, review: 'A film', watchedDate: '2020-01-02' });
});

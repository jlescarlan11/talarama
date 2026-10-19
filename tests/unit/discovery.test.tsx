import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import Discovery from '@/app/movies/Discovery';
import { useCatalogSearch } from '@/app/hooks/useCatalogSearch';
const route = vi.hoisted(() => ({ params: new URLSearchParams('mode=search&query=Alien'), push: vi.fn() }));
vi.mock('next/navigation', () => ({ useSearchParams: () => route.params, useRouter: () => ({ push: route.push }) }));
const empty = { page: 1, totalPages: 0, totalResults: 0, results: [] };
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
it('debounces title search for 300ms and restores inputs on URL navigation', () => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
  const view = render(<Discovery initial={null} />);
  fireEvent.change(screen.getByRole('searchbox', { name: 'Search movies' }), { target: { value: 'Aliens' } });
  act(() => vi.advanceTimersByTime(299)); expect(route.push).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(route.push).toHaveBeenCalledWith('/movies?mode=search&sort=popular&page=1&query=Aliens', { scroll: false });
  route.params = new URLSearchParams('mode=search&query=Back&year=2000');
  view.rerender(<Discovery initial={null} />);
  expect(screen.getByRole('searchbox', { name: 'Search movies' })).toHaveValue('Back');
  expect(screen.getByLabelText('Release year')).toHaveValue(2000);
  expect(screen.queryByLabelText('Genre')).not.toBeInTheDocument();
});
it('discards an obsolete response even when transport ignores cancellation', async () => {
  let oldResolve!: (value: Response) => void;
  vi.stubGlobal('fetch', vi.fn((url: string) => url.includes('query=Old') ? new Promise<Response>(resolve => { oldResolve = resolve; }) : Promise.resolve(Response.json({ ...empty, totalResults: 7 }))));
  const view = renderHook(({ key }) => useCatalogSearch(key, null), { initialProps: { key: 'mode=search&query=Old' } });
  view.rerender({ key: 'mode=search&query=New' });
  await waitFor(() => expect(view.result.current.data?.totalResults).toBe(7));
  await act(async () => oldResolve(Response.json({ ...empty, totalResults: 99 })));
  expect(view.result.current.data?.totalResults).toBe(7);
});
it('exposes retry after failure and clears obsolete results while loading', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(Response.json({ error: 'Unavailable' }, { status: 503 })).mockResolvedValue(Response.json(empty)));
  const view = renderHook(() => useCatalogSearch('mode=discover', null));
  await waitFor(() => expect(view.result.current.error).toBeTruthy());
  act(() => view.result.current.retry());
  await waitFor(() => expect(view.result.current.data).toEqual(empty));
  expect(view.result.current.error).toBeNull();
});

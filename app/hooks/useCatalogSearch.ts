'use client';
import { useEffect, useState } from 'react';
import type { CatalogPage } from '@/app/lib/tmdb/types';

export type CatalogInitial = { key: string; data: CatalogPage | null; error: string | null } | null;
/** Key every result to its URL and ignore obsolete work even if abort is ignored. */
export function useCatalogSearch(key: string, initial: CatalogInitial) {
  const [result, setResult] = useState(initial);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (attempt === 0 && initial?.key === key) return;
    const controller = new AbortController();
    let active = true;
    fetch(`/api/catalog?${key}`, { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error('Movie provider is unavailable. Please try again.');
      const data: CatalogPage = await response.json();
      if (active) setResult({ key, data, error: null });
    }).catch(() => {
      if (active) setResult({ key, data: null, error: 'Movie provider is unavailable. Please try again.' });
    });
    return () => { active = false; controller.abort(); };
  }, [key, attempt, initial]);
  const current = result?.key === key ? result : initial?.key === key && attempt === 0 ? initial : null;
  return { data: current?.data ?? null, error: current?.error ?? null, loading: !current, retry: () => { setResult(null); setAttempt(x => x + 1); } };
}

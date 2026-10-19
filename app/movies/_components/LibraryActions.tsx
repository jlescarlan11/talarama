'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { movieHref } from '@/app/lib/movies/links';

interface Props { localId: string | null; tmdbId: number | null; wikidataId?:string; title: string; posterUrl: string | null; signedIn: boolean; favorite: boolean; watchlist: boolean }
export default function LibraryActions(props: Props) {
  const router = useRouter();
  const [localId, setLocalId] = useState(props.localId);
  const [favorite, setFavorite] = useState(props.favorite);
  const [watchlist, setWatchlist] = useState(props.watchlist);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!props.signedIn) {
    const callbackUrl = movieHref(props);
    return <div className="space-y-3"><p className="text-base-content/70">Sign in to keep favorites, build a watchlist and log your viewings.</p><Link className="btn btn-primary" href={`/api/auth/signin?${new URLSearchParams({ callbackUrl })}`}>Sign in to save or log</Link></div>;
  }
  const resolveMovie = async () => {
    if (localId) return localId;
    const response = await fetch('/api/movies/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(props.wikidataId?{wikidataId:props.wikidataId}:{tmdbId:props.tmdbId}) });
    if (!response.ok) throw new Error(response.status === 401 ? 'Your session expired. Sign in and try again.' : 'Could not save this movie. Please try again.');
    const { movieId } = await response.json();
    if (typeof movieId !== 'string') throw new Error('Could not save this movie. Please try again.');
    setLocalId(movieId);
    return movieId;
  };
  const perform = async (kind: 'like' | 'watchlist' | 'log') => {
    if (pending) return;
    setPending(true); setError(null);
    try {
      const id = await resolveMovie();
      if (kind === 'log') {
        const params = new URLSearchParams({ movieId: id, title: props.title, ...(props.posterUrl ? { posterUrl: props.posterUrl } : {}) });
        router.push(`/diaries/new?${params}`);
      } else {
        const present = !(kind === 'like' ? favorite : watchlist);
        const response = await fetch(`/api/movies/${encodeURIComponent(id)}/${kind}`, { method: present ? 'POST' : 'DELETE' });
        if (!response.ok) throw new Error(response.status === 401 ? 'Your session expired. Sign in and try again.' : 'Could not update your library. Please try again.');
        if (kind === 'like') setFavorite(present); else setWatchlist(present);
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not save. Please try again.'); }
    finally { setPending(false); }
  };
  return <div className="space-y-3" aria-busy={pending}>
    <div className="flex flex-wrap gap-3">
      <button className="btn btn-primary" disabled={pending} onClick={() => perform('log')}>Log Now</button>
      <button className="btn btn-outline" aria-pressed={watchlist} disabled={pending} onClick={() => perform('watchlist')}>{watchlist ? 'In Watchlist' : 'Add to Watchlist'}</button>
      <button className="btn btn-outline" aria-label={favorite ? 'Unlike movie' : 'Like movie'} aria-pressed={favorite} disabled={pending} onClick={() => perform('like')}>{favorite ? 'Remove favorite' : 'Add favorite'}</button>
    </div>
    {pending && <p role="status" className="text-sm">Saving…</p>}
    {error && <p role="alert" className="text-error">{error}</p>}
  </div>;
}

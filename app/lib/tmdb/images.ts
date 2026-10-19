/** Never accept arbitrary provider URLs or active image formats. Missing artwork uses the UI's local fallback. */
export function tmdbImage(path: string | null | undefined, kind: 'poster' | 'backdrop' = 'poster'): string | null {
  if (!path || !/^\/[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/.test(path)) return null;
  return `https://image.tmdb.org/t/p/${kind === 'poster' ? 'w500' : 'w1280'}${path}`;
}

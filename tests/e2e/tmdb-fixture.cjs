// Test-process transport only. Never imported by application modules.
const originalFetch = globalThis.fetch;
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Node --require preload must remain CommonJS.
const previewFetch = process.env.TALARAMA_PREVIEW_CATALOG === '1' ? require('./preview-catalog.cjs').createPreviewFetch(originalFetch) : null;
const film = (id = 70001, title = 'Fixture Moon') => ({ id, title, adult: false, overview: 'A synthetic journey through cinema.', release_date: '2020-01-01', poster_path: null, backdrop_path: null, vote_average: 8.2, vote_count: 12 });
globalThis.fetch = async (input, options) => {
  if (previewFetch) return previewFetch(input, options);
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.origin !== 'https://api.themoviedb.org') return originalFetch(input, options);
  if (url.pathname.includes('/movie/')) {
    const id = Number(url.pathname.split('/').at(-1));
    if ([70004, 70006].includes(id)) return Response.json({}, { status: 503 });
    if (id === 70005) return Response.json({}, { status: 404 });
    return Response.json({ ...film(id, id === 70002 ? 'Fixture Second' : 'Fixture Moon'), runtime: null, genres: [{ id: 18, name: 'Drama' }], credits: { cast: [{ id: 1, name: 'Synthetic Actor', character: 'Explorer' }], crew: [{ id: 2, name: 'Synthetic Director', job: 'Director' }] } });
  }
  const query = url.searchParams.get('query');
  if (query === 'Provider error') return Response.json({}, { status: 503 });
  const page = Number(url.searchParams.get('page') || 1);
  const empty = query === 'Empty';
  return Response.json({ page, total_pages: empty ? 0 : 2, total_results: empty ? 0 : 2, results: empty ? [] : [film(page === 1 ? 70001 : 70002, query || (page === 1 ? 'Fixture Moon' : 'Fixture Second'))] });
};

// Invented LOCAL PREVIEW data only. This module is never imported by the app.
// Node's --require preload is CommonJS, including its offline image generator.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sharp = require('sharp');
const titles = ['Harbor Lights', 'The Quiet Orbit', 'Letters in Rain', 'A Map of Elsewhere', 'Midnight Radio', 'The Last Observatory', 'Summer on Platform Nine', 'Paper Constellations', 'The Glass Garden', 'Beyond the Blue', 'Echoes of Tomorrow', 'The Long Way Home', 'Harbor at Dawn', 'A Small Kind of Wonder', 'Night Train North', 'The Amber Sea', 'Signals from Home', 'The Clockmaker', 'Where the River Turns', 'A Different Sky', 'Lanterns in Winter', 'The Violet Hour', 'Across the Valley', 'The Final Frame'];
const genreIds = [18, 878, 12];
const genres = { 18: 'Drama', 878: 'Science Fiction', 12: 'Adventure' };
const films = titles.map((title, index) => ({ id: 970001 + index, title: `Sample: ${title}`, adult: false, overview: 'An invented film for the disposable local preview. This is not a real TMDB listing.', release_date: `${2020 + index % 3}-01-01`, genre_ids: [genreIds[index % 3]], poster_path: `/talarama-preview-${index}.png`, backdrop_path: null, vote_average: 6.5 + index % 5 * .5, vote_count: 10 + index }));
const artwork = new Map();
function poster(index) {
  if (!artwork.has(index)) {
    const hue = index * 37 % 360;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="750"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue},45%,32%)"/><stop offset="1" stop-color="#10131d"/></linearGradient></defs><rect width="500" height="750" fill="url(#g)"/><circle cx="${160 + index % 3 * 80}" cy="245" r="110" fill="hsl(${(hue + 45) % 360},60%,75%)" opacity=".8"/><path d="M0 470L170 290L310 450L430 330L500 470V750H0Z" fill="#0d1220" opacity=".7"/><path d="M0 530L210 390L380 510L500 420V750H0Z" fill="#080b15" opacity=".8"/><text x="40" y="65" font-family="sans-serif" font-size="16" letter-spacing="5" fill="#fff" opacity=".8">TALARAMA / SAMPLE</text><text x="40" y="550" font-family="sans-serif" font-size="76" fill="#fff" opacity=".45">${String(index + 1).padStart(2, '0')}</text></svg>`;
    artwork.set(index, sharp(Buffer.from(svg)).png().toBuffer());
  }
  return artwork.get(index);
}
// Pinned Next16 uses native HTTPS for optimized images, bypassing global fetch.
// Replace only this process's exported upstream transport; retain optimization,
// URL validation and all other exports. Never permit external artwork in samples.
const optimizerPath = require.resolve('next/dist/server/image-optimizer');
// eslint-disable-next-line @typescript-eslint/no-require-imports -- Node-only preview preload.
const optimizer = require(optimizerPath);
const descriptors = Object.getOwnPropertyDescriptors(optimizer);
descriptors.fetchExternalImage = { enumerable: true, value: async href => {
  const url = new URL(href);
  const match = url.pathname.match(/^\/t\/p\/(w500|w1280)\/talarama-preview-(\d+)\.png$/);
  const index = Number(match?.[2]);
  if (url.origin !== 'https://image.tmdb.org' || url.search || !match || index >= films.length) throw new Error('External artwork is disabled in sample preview');
  return { buffer: await poster(index), contentType: 'image/png', cacheControl: 'public,max-age=3600', etag: `"local-sample-${index}"` };
} };
require.cache[optimizerPath].exports = Object.defineProperties({}, descriptors);
exports.createPreviewFetch = originalFetch => async (input, options) => {
  const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
  if (url.origin === 'https://image.tmdb.org') {
    const match = url.pathname.match(/\/talarama-preview-(\d+)\.png$/);
    if (!match || Number(match[1]) >= films.length) return new Response(null, { status: 404 });
    return new Response(await poster(Number(match[1])), { headers: { 'content-type': 'image/png' } });
  }
  if (url.origin !== 'https://api.themoviedb.org') return originalFetch(input, options);
  const detail = url.pathname.match(/^\/3\/movie\/(\d+)$/);
  if (detail) {
    const film = films.find(movie => movie.id === Number(detail[1]));
    return film ? Response.json({ ...film, runtime: 90 + (film.id % 5) * 10, genres: film.genre_ids.map(id => ({ id, name: genres[id] })), credits: { cast: [{ id: 1, name: 'Sample Actor', character: 'A fictional role' }], crew: [{ id: 2, name: 'Sample Director', job: 'Director' }] } }) : Response.json({}, { status: 404 });
  }
  const query = (url.searchParams.get('query') || '').trim().toLowerCase();
  const genre = Number(url.searchParams.get('with_genres'));
  const year = url.searchParams.get('primary_release_year') || url.searchParams.get('year');
  const matching = films.filter(movie => (!query || movie.title.toLowerCase().includes(query)) && (!genre || movie.genre_ids.includes(genre)) && (!year || movie.release_date.startsWith(`${year}-`)));
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  return Response.json({ page, total_pages: Math.ceil(matching.length / 12), total_results: matching.length, results: matching.slice((page - 1) * 12, page * 12) });
};

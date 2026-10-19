import { execFileSync } from 'node:child_process';
import { expect, it } from 'vitest';

it('offers multiple preview pages, real filtering/search over invented titles and offline artwork', () => {
  const script = `
    require('./tests/e2e/tmdb-fixture.cjs');
    (async () => {
      const read = async path => (await fetch('https://api.themoviedb.org/3/' + path)).json();
      const first = await read('discover/movie?page=1');
      const second = await read('discover/movie?page=2');
      const filtered = await read('discover/movie?with_genres=18&primary_release_year=2020');
      const search = await read('search/movie?query=Harbor');
      const detail = await read('movie/' + first.results[0].id);
      const poster = first.results[0].poster_path && await fetch('https://image.tmdb.org/t/p/w500' + first.results[0].poster_path);
      console.log(JSON.stringify({ first, second, filtered, search, detail, posterType: poster?.headers.get('content-type'), posterBytes: poster && (await poster.arrayBuffer()).byteLength }));
    })().catch(error => { console.error(error); process.exitCode = 1; });
  `;
  const output = execFileSync(process.execPath, ['-e', script], { env: { ...process.env, TALARAMA_PREVIEW_CATALOG: '1' }, encoding: 'utf8', timeout: 15000 });
  const result = JSON.parse(output);
  expect(result.first.results).toHaveLength(12);
  expect(result.first.total_results).toBe(24);
  expect(result.second.results).toHaveLength(12);
  expect(result.first.results.some((film: { id: number }) => result.second.results.some((other: { id: number }) => film.id === other.id))).toBe(false);
  expect(result.filtered.results.length).toBeGreaterThan(0);
  for (const film of result.filtered.results) { expect(film.genre_ids).toContain(18); expect(film.release_date).toMatch(/^2020/); }
  expect(result.search.results).toHaveLength(2);
  expect(result.search.results.every((film: { title: string }) => film.title.includes('Harbor'))).toBe(true);
  expect(result.detail.title).toBe(result.first.results[0].title);
  expect(result.posterType).toBe('image/png');
  expect(result.posterBytes).toBeGreaterThan(1000);
});

import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';

test('visitor browses, paginates, shares details and restores filters at every layout', async ({ page }) => {
  const db = new PrismaClient({ datasourceUrl: process.env.TALARAMA_E2E_DATABASE_URL });
  try {
    const before = await db.movie.count();
    for (const width of [360, 768, 1440]) {
      await page.emulateMedia({ colorScheme: width === 768 ? 'dark' : 'light', reducedMotion: 'reduce' });
      await page.setViewportSize({ width, height: 1000 });
      await page.goto('/movies?mode=discover&genre=18&year=2020&sort=popular&page=1');
      await expect(page.getByRole('link', { name: /Fixture Moon/ })).toBeVisible();
      await expect(page.getByLabel('Genre')).toHaveValue('18');
      const introduction = page.getByText('Explore popular films or find a title you love. Save your picks and make them part of your story.');
      expect(await introduction.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(Math.min(width - 80, 500));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `.superpowers/phase2-discovery-${width}.png`, fullPage: true, caret: 'initial' });
      await page.getByRole('button', { name: 'Next', exact: true }).click();
      await expect(page).toHaveURL(/page=2/);
      await expect(page.getByRole('link', { name: /Fixture Second/ })).toBeVisible();
      await page.goBack();
      await expect(page.getByLabel('Release year')).toHaveValue('2020');
      await page.getByRole('link', { name: /Fixture Moon/ }).click();
      await expect(page).toHaveURL(/\/movies\/tmdb\/70001$/, {timeout:15000});
      await expect(page.getByRole('heading', { name: 'Fixture Moon' })).toBeVisible();
      await expect(page.getByText('TMDB 8.2/10')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Sign in to save or log' })).toBeVisible();
      await expect(page.getByText('Synthetic Director')).toBeVisible();
      await expect(page.getByText('Runtime unknown')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `.superpowers/phase2-detail-${width}.png`, fullPage: true, caret: 'initial' });
    }
    expect(await db.movie.count()).toBe(before); // Every browse/detail is read-only.
  } finally { await db.$disconnect(); }
});

test('title/year search handles empty and failed provider states and keyboard controls', async ({ page }) => {
  await page.goto('/movies');
  await page.getByRole('button', { name: 'Search by title' }).click();
  const search = page.getByRole('searchbox', { name: 'Search movies' });
  await search.fill('Empty');
  await expect(page).toHaveURL(/query=Empty/);
  await expect(page.getByText('No movies found. Try a different title or filter.')).toBeVisible();
  await expect(page.getByLabel('Genre')).toHaveCount(0);
  await search.fill('Provider error');
  await expect(page.locator('main').getByRole('alert')).toContainText('Movie provider is unavailable');
  await page.getByRole('button', { name: 'Try again' }).focus();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('main').getByRole('alert')).toBeVisible();
  await search.fill('Recovered');
  await expect(page.getByRole('link', { name: /Recovered/ })).toBeVisible();
  await page.goto('/movies?page=0');
  await expect(page.locator('main').getByRole('alert')).toContainText('Invalid discovery filters');
});

test('authenticated external saves import once and idempotent retries preserve library intent', async ({ page, context }) => {
  const token = await encode({ secret: process.env.TALARAMA_E2E_SECRET!, token: { sub: 'browser-owner', id: 'browser-owner', username: 'browser_member', name: 'Browser member', picture: '/appLogoLight.png' } });
  await context.addCookies([{ name: 'next-auth.session-token', value: token, url: 'http://127.0.0.1:3100', httpOnly: true, sameSite: 'Lax' }]);
  const db = new PrismaClient({ datasourceUrl: process.env.TALARAMA_E2E_DATABASE_URL });
  try {
    await page.goto('/movies/tmdb/70001');
    await page.getByRole('button', { name: 'Add to Watchlist' }).click();
    await expect(page.getByRole('button', { name: 'In Watchlist' })).toBeVisible();
    await page.getByRole('button', { name: 'Like movie', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Unlike movie' })).toBeVisible();
    const movie = await db.movie.findUniqueOrThrow({ where: { tmdbId: 70001 } });
    expect(await db.movie.count({ where: { tmdbId: 70001 } })).toBe(1);
    for (let i = 0; i < 2; i++) expect((await page.request.post(`/api/movies/${movie.id}/watchlist`)).status()).toBe(200);
    expect(await db.watchlistEntry.count({ where: { movieId: movie.id } })).toBe(1);
    await page.goto('/diaries');
    await page.getByRole('tab', { name: 'Watchlist', exact: true }).click();
    await expect(page.getByRole('link', { name: /Fixture Moon/ })).toHaveAttribute('href', '/movies/tmdb/70001');
    await page.getByRole('link', { name: /Fixture Moon/ }).click();
    await page.getByRole('button', { name: 'In Watchlist' }).click();
    await expect(page.getByRole('button', { name: 'Add to Watchlist' })).toBeVisible();
    await page.getByRole('button', { name: 'Unlike movie' }).click();
    await expect(page.getByRole('button', { name: 'Like movie' })).toBeVisible();
    expect((await page.request.post('/api/movies', { data: { title: 'Forged' } })).status()).toBe(403);
    expect((await page.request.patch(`/api/movies/${movie.id}`, { data: { title: 'Forged' } })).status()).toBe(403);
    expect((await page.request.delete(`/api/movies/${movie.id}`)).status()).toBe(403);
  } finally { await db.$disconnect(); }
});

test('removed/invalid external IDs and failed provider retain useful detail states', async ({ page }) => {
  await page.goto('/movies/tmdb/70006');
  await expect(page.getByRole('heading', { name: 'Movie information is unavailable' })).toBeVisible();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Movie information is unavailable' })).toBeVisible();
  await page.goto('/movies/tmdb/70004');
  await expect(page.getByRole('heading', { name: 'Preserved Snapshot' })).toBeVisible();
  await expect(page.getByRole('status').filter({hasText:'Showing the saved local snapshot'})).toBeVisible();
  await expect(page.getByRole('article').getByText('Legacy Director')).toBeVisible();
  await page.goto('/movies/browser-movie');
  await expect(page.getByRole('heading', { name: 'Phase Zero Film' })).toBeVisible();
  for (const id of ['0', 'not-a-number', '70005']) {
    const response = await page.goto(`/movies/tmdb/${id}`);
    // Next streaming not-found responses may already have sent HTTP 200.
    expect([200, 404]).toContain(response?.status());
    await expect(page.getByRole('heading', { name: 'Movie not found' })).toBeVisible();
  }
});

test('loading and rapid URL changes cannot show obsolete search results', async ({ page }) => {
  await page.goto('/movies?mode=search');
  // Confirm React/Next hydration installed its history integration before using it.
  await page.getByRole('button', { name: 'Search by title' }).click();
  await expect(page).toHaveURL(/sort=popular&page=1/);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/catalog?**', async route => {
    const query = new URL(route.request().url()).searchParams.get('query');
    if (query === 'Old') await gate;
    await route.fulfill({ json: { page: 1, totalPages: 1, totalResults: 1, results: [{ localId: null, tmdbId: 70001, title: query, description: null, releasedYear: null, duration: null, posterUrl: null, backdropUrl: null, tmdbScore: null, tmdbVoteCount: 0, genres: [], cast: [], directors: [] }] } }).catch(() => {});
  });
  await page.getByRole('searchbox', { name: 'Search movies' }).fill('Old');
  await expect(page.getByRole('status', { name: 'Loading movies' })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search movies' }).fill('Fresh');
  await expect(page.getByRole('link', { name: /Fresh/ })).toBeVisible();
  release();
  await expect(page.getByRole('link', { name: /Old/ })).toHaveCount(0);
  await expect(page.getByRole('searchbox', { name: 'Search movies' })).toHaveValue('Fresh');
});

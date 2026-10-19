import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

test('original welcome and poster carousel keep dynamic read-only discovery at mobile and desktop sizes', async ({ page }) => {
  const db = new PrismaClient({ datasourceUrl: process.env.TALARAMA_E2E_DATABASE_URL });
  try {
    const before = await db.movie.count();
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: width === 768 ? 'dark' : 'light', reducedMotion: 'reduce' });
      await page.goto('/');
      await expect(page.getByRole('heading', { name: 'Welcome to Movie Diary' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Movie carousel' })).toBeVisible();
      await expect(page.getByRole('listitem', { name: 'Fixture Moon (2020)' }).first()).toHaveAttribute('href', '/movies/tmdb/70001');
      const activeCard = page.getByRole('listitem', { name: 'Fixture Moon (2020)' }).nth(2);
      await activeCard.focus();
      await expect(activeCard.getByText('TMDB 8.2/10').last()).toBeVisible();
      await expect(page.getByRole('link', { name: 'Discover movies', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `.superpowers/restored-home-${width}.png`, fullPage: true });
    }
    expect(await db.movie.count()).toBe(before);
  } finally { await db.$disconnect(); }
});

import { test, expect } from '@playwright/test';
import { encode } from 'next-auth/jwt';
import { PrismaClient } from '@prisma/client';

test('existing member saves, logs, edits and deletes a viewing through the browser', async ({ context, page }) => {
  // Synthetic signed JWT exercises application auth/session wiring, not Google OAuth.
  const token = await encode({ secret: process.env.TALARAMA_E2E_SECRET!, token: { sub: 'browser-owner', id: 'browser-owner', username: 'browser_member', name: 'Browser member', email: 'browser@example.invalid', picture: '/appLogoLight.png' } });
  await context.addCookies([{ name: 'next-auth.session-token', value: token, url: 'http://127.0.0.1:3100', httpOnly: true, sameSite: 'Lax' }]);
  const db = new PrismaClient({ datasourceUrl: process.env.TALARAMA_E2E_DATABASE_URL });
  try {
    // Existing diary avatars request quality 100; keep that working after Next upgrades.
    expect((await page.request.get('/_next/image?url=%2FappLogoLight.png&w=128&q=100')).status()).toBe(200);
    expect((await page.request.get('/movies/new', { maxRedirects: 0 })).status()).toBe(200);
    await page.goto('/movies/browser-movie');
    const saved = page.waitForResponse(response => response.url().endsWith('/api/movies/browser-movie/watchlist') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Add to Watchlist' }).click();
    expect((await saved).status()).toBe(200);
    await expect(page.getByRole('button', { name: 'In Watchlist' })).toBeVisible();
    await page.getByRole('button', { name: 'Like movie', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Unlike movie', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Log Now' }).click();
    await page.getByRole('button', { name: 'Rate 4 out of 5' }).click();
    await page.getByLabel('Watched Date').fill('2020-02-29');
    // Empty review is intentionally valid and must persist as an empty string.
    await page.getByRole('button', { name: 'Save Entry', exact: true }).click();
    await expect(page).toHaveURL(/\/diaries$/);
    const entry = await db.diaryEntry.findFirstOrThrow({ where: { userId: 'browser-owner' } });
    expect(entry).toMatchObject({ movieId: 'browser-movie', rating: 4, review: '' });
    await page.goto(`/diaries/edit/${entry.id}`);
    await page.getByLabel('Review (optional)').fill('Edited in the browser');
    await page.getByRole('button', { name: 'Rate 5 out of 5' }).click();
    const updated = page.waitForResponse(response => response.url().includes(`/api/diaries/${entry.id}`) && response.request().method() === 'PATCH');
    await page.getByRole('button', { name: 'Update Entry', exact: true }).click();
    expect((await updated).status()).toBe(200);
    await expect(page).toHaveURL(/\/diaries$/, { timeout: 15000 });
    await page.getByRole('tab', { name: 'My Diary', exact: true }).click();
    await expect(page.getByText('Edited in the browser', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Entry options' }).click();
    await page.getByRole('menuitem', { name: 'Delete Entry' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Delete Entry', exact: true }).click();
    await expect.poll(() => db.diaryEntry.count({ where: { userId: 'browser-owner' } })).toBe(0);
    expect(await db.account.findUnique({ where: { id: 'browser-google-link' } })).toMatchObject({ userId: 'browser-owner', providerAccountId: 'synthetic-google-sub' });
    expect(await db.likedBy.count()).toBe(1);
    expect(await db.watchedList.count()).toBe(1);
  } finally { await db.$disconnect(); }
});

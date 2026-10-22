import { test, expect, type Page } from '@playwright/test';
import { PrismaClient } from '@prisma/client';
import { encode } from 'next-auth/jwt';

// This label is inserted only by the capture test, never by application code.
async function capture(page: Page, name: string) {
  // A pseudo-element avoids changing React's body tree during hydration.
  await page.addStyleTag({ content: 'nextjs-portal { visibility: hidden; } main::before { content: "LOCAL SYNTHETIC FIXTURE · Invented movies, members and reviews · Not live service evidence"; display: block; padding: 12px; background: #0d253f; color: #fff; font: 600 14px/1.5 system-ui; margin-bottom: 24px; border-radius: 8px; }' });
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.screenshot({ path: `.superpowers/phase5-${name}.png`, fullPage: true, caret: 'initial' });
}

test('first member and empty community work without seeded public reviews at all layouts', async ({ page, context }) => {
  const db = new PrismaClient({ datasourceUrl: process.env.TALARAMA_E2E_DATABASE_URL });
  const id = 'phase5-first-member';
  try {
    await db.user.create({ data: { id, username: 'phase5_first', email: 'phase5-first@example.invalid', name: 'Synthetic first member' } });
    const token = await encode({ secret: process.env.TALARAMA_E2E_SECRET!, token: { sub: id, id, username: 'phase5_first', email: 'phase5-first@example.invalid', name: 'Synthetic first member' } });
    await context.addCookies([{ name: 'next-auth.session-token', value: token, url: 'http://127.0.0.1:3100', httpOnly: true, sameSite: 'Lax' }]);
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: width === 768 ? 'dark' : 'light', reducedMotion: 'reduce' });
      await page.goto('/diaries');
      await expect(page.getByRole('main').getByText('0 viewing logs · 0 distinct movies', { exact: true })).toBeVisible();
      await expect(page.getByText('No diary entries yet')).toBeVisible();
      await page.getByRole('tab', { name: 'Favorites', exact: true }).click();
      await expect(page.getByRole('tabpanel')).toContainText(/no|haven.t/i);
      await page.getByRole('tab', { name: 'Watchlist', exact: true }).click();
      await expect(page.getByRole('tabpanel')).toContainText(/no|empty/i);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.goto('/community');
      await expect(page.getByText('No public activity yet')).toBeVisible();
      await expect(page.getByRole('article')).toHaveCount(0);
      await capture(page, `empty-community-${width}`);
      await page.goto('/movies');
      await expect(page.getByRole('link', { name: /Fixture Moon/ })).toBeVisible();
      await capture(page, `discovery-${width}`);
    }
    expect(await db.diaryEntry.count({ where: { userId: id } })).toBe(0);
    expect((await page.request.get('/api/members/phase5_first')).status()).toBe(404);
    // Publish only this disposable invented member for clearly labeled portfolio evidence.
    await db.user.update({ where: { id }, data: { profilePublished: true, bio: 'Synthetic portfolio member. This is disposable fixture data.' } });
    await db.diaryEntry.create({ data: { id: 'phase5-fixture-review', userId: id, movieId: 'browser-movie', watchedDate: new Date('2020-02-29'), rating: 4, review: 'Synthetic fixture review: a quiet film worth returning to. This is invented test content.', visibility: 'PUBLIC' } });
    for (const width of [360, 768, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: width === 768 ? 'dark' : 'light', reducedMotion: 'reduce' });
      await page.goto('/community');
      await expect(page.getByRole('article').filter({ hasText: 'Synthetic fixture review' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await capture(page, `community-${width}`);
      await page.goto('/members/phase5_first');
      await expect(page.getByRole('heading', { name: 'Synthetic first member', exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await capture(page, `profile-${width}`);
    }
  } finally {
    await db.diaryEntry.deleteMany({ where: { userId: id } });
    await db.user.deleteMany({ where: { id } });
    await db.$disconnect();
  }
});

test('credits support skip navigation, visible focus, both themes and readable contrast', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 360, height: 1000 });
    await page.goto('/about');
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main')).toBeFocused();
    const provider = page.getByRole('link', { name: 'TMDB', exact: true });
    await provider.focus();
    await expect(provider).toBeFocused();
    const outline = await provider.evaluate(el => ({ width: getComputedStyle(el).outlineWidth, style: getComputedStyle(el).outlineStyle }));
    expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
    expect(outline.style).not.toBe('none');
    await expect(page.getByRole('img', { name: 'TMDB', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const ratios = await page.locator('main article p').evaluateAll(elements => {
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      const rgba = (color: string) => { ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1); return [...ctx.getImageData(0, 0, 1, 1).data]; };
      const over = (fg: number[], bg: number[]) => fg.slice(0, 3).map((c, i) => c * fg[3] / 255 + bg[i] * (1 - fg[3] / 255));
      const luminance = (rgb: number[]) => rgb.map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4).reduce((n, c, i) => n + c * [.2126, .7152, .0722][i], 0);
      return elements.map(el => {
        const ancestors: Element[] = []; for (let node: Element | null = el; node; node = node.parentElement) ancestors.unshift(node);
        let bg = [255, 255, 255]; for (const node of ancestors) bg = over(rgba(getComputedStyle(node).backgroundColor), bg);
        const foreground = over(rgba(getComputedStyle(el).color), bg);
        const a = luminance(foreground), b = luminance(bg);
        return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      });
    });
    expect(ratios.length).toBeGreaterThan(4);
    for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
    test.info().annotations.push({ type: `contrast-${colorScheme}`, description: `Minimum sampled credits paragraph ratio ${Math.min(...ratios).toFixed(2)}:1` });
    expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
    await capture(page, `credits-${colorScheme}`);
  }
});

test('slow catalog and community reads expose loading then keyboard-retryable failures', async ({ page }) => {
  await page.goto('/movies?mode=search');
  let releaseCatalog!: () => void;
  const catalogGate = new Promise<void>(resolve => { releaseCatalog = resolve; });
  await page.route('**/api/catalog?**', async route => { await catalogGate; await route.fulfill({ status: 503, json: { error: 'Movie provider is unavailable. Try again.' } }); });
  await page.getByRole('searchbox', { name: 'Search movies' }).fill('Phase five slow');
  await expect(page.getByRole('status', { name: 'Loading movies' })).toBeVisible();
  releaseCatalog();
  await expect(page.locator('main').getByRole('alert')).toContainText('Movie provider is unavailable');
  await page.unroute('**/api/catalog?**');
  await page.getByRole('button', { name: 'Try again' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: /Phase five slow/ })).toBeVisible();
  let releaseCommunity!: () => void;
  const communityGate = new Promise<void>(resolve => { releaseCommunity = resolve; });
  await page.route('**/api/community', async route => { await communityGate; await route.fulfill({ status: 503, json: { error: 'Community temporarily unavailable' } }); });
  await page.goto('/community');
  await expect(page.getByRole('status').filter({ hasText: 'Checking public availability' })).toBeVisible();
  releaseCommunity();
  await expect(page.locator('main').getByRole('alert')).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
  await page.unroute('**/api/community');
  await page.getByRole('button', { name: 'Try again' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('No public activity yet')).toBeVisible();
});

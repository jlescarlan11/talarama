import { test, expect } from '@playwright/test';
for (const width of [360, 768, 1440]) {
  test(`anonymous diary provides sign-in and keyboard navigation at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/diaries');
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.superpowers/anonymous-${width}.png`, fullPage: true });
  });
}

test('anonymous visitors are redirected before the protected movie form renders', async ({ request }) => {
  const response = await request.get('/movies/new', { maxRedirects: 0 });
  expect([302, 307]).toContain(response.status());
  expect(response.headers().location).toContain('/api/auth/signin?');
});

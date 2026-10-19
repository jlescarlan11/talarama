import { test, expect } from '@playwright/test';
test('mobile menu traps focus and returns it to the opener on Escape', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/diaries');
  const opener = page.getByRole('button', { name: 'Open menu' });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: 'Mobile menu' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Discover' })).toBeVisible();
  for (let i = 0; i < 7; i++) {
    await page.keyboard.press('Tab');
    expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});
test('light and dark themes use readable surfaces without horizontal overflow', async ({ page }) => {
  for (const colorScheme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
    await page.goto('/diaries');
    await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme);
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `.superpowers/foundation-${colorScheme}.png`, fullPage: true });
  }
});

test('resizing an open mobile menu to desktop releases the page', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 900 });
  await page.goto('/diaries');
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('dialog', { name: 'Mobile menu' })).toBeVisible();
  await page.setViewportSize({ width: 768, height: 900 });
  await expect.poll(() => page.locator('#mobile-menu').evaluate(el => (el as HTMLDialogElement).open)).toBe(false);
  await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden');
  const discover = page.locator('nav').getByRole('link', { name: 'Discover', exact: true });
  await discover.focus();
  await expect(discover).toBeFocused();
});

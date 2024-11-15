import { expect, test } from '../../playwright/fixtures';

test('has filters', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL('**/list/**');

  await page.locator('.app-second-sidebar ul li').first().waitFor();

  // Expect h1 to contain a substring.
  expect(
    await page.locator('.app-second-sidebar ul li').count(),
  ).toBeGreaterThan(1);
});

test('filters changing', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL('**/list/**');

  await page.locator('.app-second-sidebar ul li').nth(0).waitFor();
  await page.locator('.app-second-sidebar ul li').nth(0).click();

  expect(await page.locator('.rw-sorttablerow').count()).toBeGreaterThan(0);

  await page.locator('.app-second-sidebar ul li').nth(1).waitFor();
  await page.locator('.app-second-sidebar ul li').nth(1).click();

  // Expect h1 to contain a substring.
  expect(await page.locator('.rw-sorttablerow').count()).toBeGreaterThan(0);
});

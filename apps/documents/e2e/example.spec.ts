import { test } from '../../playwright/fixtures';

test('has title', async ({ page }) => {
  await page.goto('/');
});

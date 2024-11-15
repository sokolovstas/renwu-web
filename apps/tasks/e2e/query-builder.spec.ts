import { expect, test } from '../../playwright/fixtures';

test('change text query', async ({ page }) => {
  await page.goto('/');
  await page.waitForURL('**/list/**');

  await page.locator('renwu-query-builder input').fill('');
  await page.keyboard.type('s', { delay: 100 });
  await page.locator('.hints-container .hint').first().waitFor();
  expect(await page.locator('.hints-container .hint').count()).toBeGreaterThan(
    0,
  );
  await page.keyboard.type('tat'), { delay: 100 };
  await page.locator('.hints-container .hint').first().waitFor();
  expect(await page.locator('.hints-container .hint').count()).toBe(2);
  await page.keyboard.press('Enter', { delay: 100 });
  await expect(page.locator('renwu-query-builder input')).toHaveValue(
    'status ',
  );
  await page.locator('.hints-container .hint').first().waitFor();
  expect(await page.locator('.hints-container .hint').count()).toBe(4);
  await page.keyboard.press('Tab', { delay: 100 });
  await expect(page.locator('renwu-query-builder input')).toHaveValue(
    'status = ',
  );
  await page.keyboard.type('open', { delay: 100 });
  await page.locator('.hints-container .hint').first().waitFor();
  expect(await page.locator('.hints-container .hint').count()).toBeGreaterThan(
    1,
  );
  await page.keyboard.press('Enter', { delay: 100 });
  await expect(page.locator('renwu-query-builder input')).toHaveValue(
    'status = Open ',
  );
  await page.waitForRequest(
    (req) => req.postDataJSON()['query'] === 'status = Open ',
  );
  expect(await page.locator('.rw-sorttablerow').count()).toBeGreaterThan(0);
});

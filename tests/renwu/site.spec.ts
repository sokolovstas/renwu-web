import { test } from '@playwright/test';

test('Register', async ({ page }) => {
  await page.goto('http://localhost:8002');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Вход' })
    .click();
  await page.getByRole('link', { name: 'Зарегистрироваться' }).click();
  await page.getByPlaceholder('имя').click();
  await page.getByPlaceholder('имя').fill('Test');
  await page.getByPlaceholder('имя').press('Tab');
  await page.getByPlaceholder('телефон').fill('+1234567890');
  await page.getByPlaceholder('компания').click();
  await page.getByPlaceholder('компания').fill('company');
  await page.getByPlaceholder('адрес электронной почты').click();
  await page
    .getByPlaceholder('адрес электронной почты')
    .fill('test@testgmail.com');
  await page.getByPlaceholder('адрес электронной почты').press('Tab');
  await page.getByPlaceholder('пароль').fill('qwerty');
  await page.getByRole('button', { name: 'Зарегистрироваться' }).click();
  await page.waitForURL(/app/);
});
test('Login', async ({ page }) => {
  await page.goto('http://localhost:8002/');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Вход' })
    .click();
  await page.getByPlaceholder('адрес электронной почты').click();
  await page
    .getByPlaceholder('адрес электронной почты')
    .fill('test@testgmail.com');
  await page.getByPlaceholder('пароль').click();
  await page.getByPlaceholder('пароль').fill('qwerty');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(/app/);
});
test('Check app', async ({ page }) => {
  await page.goto('http://localhost:4200/');
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Вход' })
    .click();
  await page.getByPlaceholder('адрес электронной почты').click();
  await page
    .getByPlaceholder('адрес электронной почты')
    .fill('test@testgmail.com');
  await page.getByPlaceholder('пароль').click();
  await page.getByPlaceholder('пароль').fill('qwerty');
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(/app/);
});

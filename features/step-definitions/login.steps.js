const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { chromium, expect } = require('@playwright/test');

let browser;
let page;

  const emailAdmin = `admin@admin.pl`;
  const passwordOwner = '123';

Before(async () => {
  browser = await chromium.launch({
    headless: false
  });

  page = await browser.newPage();
});

After(async () => {
  await browser.close();
});

Given('user opens login page', async () => {
    await page.goto('http://localhost:3000/login');
});

When('user login in with valid credential', async () => {
  await page.getByRole('textbox', { name: 'twoj@email.com' }).click();
  await page.getByRole('textbox', { name: 'twoj@email.com' }).fill('admin@admin.pl');
  await page.getByRole('textbox', { name: '••••••••' }).click();
  await page.getByRole('textbox', { name: '••••••••' }).fill('123');
  await page.getByRole('button', { name: 'Zaloguj' }).click();
  
});

Then('user name should be visible on main page', async () => {
  await expect(
    await page.getByText('Cześć, Admin!')).toBeVisible();
  
});

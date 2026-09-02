const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { chromium, expect } = require('@playwright/test');

let browser;
let page;

//student data//
  const uniqueIdStudent = Date.now().toString().slice(-6);
  const emailStudent = `student${uniqueIdStudent}@wp.pl`;
  const loginStudent = `jacek${uniqueIdStudent}`;
  const passwordStudent = '123456';
  const nameStudent = 'Jacek Ryszewski';
//owner data//
  const uniqueIdOwner = Date.now().toString().slice(-7);
  const emailOwner = `owner${uniqueIdOwner}@wp.pl`;
  const loginOwner = `jacek${uniqueIdOwner}`;
  const passwordOwner = '123456';
  const nameOwner = 'Jacek Ryszka';
  const phoneOwner = '505494921';
Before(async () => {
  browser = await chromium.launch({
    headless: false
  });

  page = await browser.newPage();
});

After(async () => {
  await browser.close();
});

Given('user opens register page', async () => {
    await page.goto('http://localhost:3000/login');
});

When('user registers in as student', async () => {
  await page.getByRole('link', { name: 'Zaloguj się' }).click();
  await page.getByRole('button', { name: 'Rejestracja' }).click();
  await page.getByRole('textbox', { name: 'twoj@email.com' }).fill(emailStudent);
  await page.getByRole('textbox', { name: '••••••••' }).fill(passwordStudent);
  await page.getByRole('textbox', { name: 'jan_kowalski' }).fill(loginStudent);
  await page.getByRole('textbox', { name: 'Jan Kowalski' }).fill(nameStudent);
  await page.getByPlaceholder('np.').fill('23');
  await page.locator('select[name="gender"]').selectOption('male');
  await page.locator('select[name="status"]').selectOption('student');

  await page.getByRole('button', { name: 'Zarejestruj' }).click();
});

Then('success alert should be visible', async () => {
  await expect(
    page.getByText('Konto utworzone! Możesz się teraz zalogować.')
  ).toBeVisible();
});


 When('user registers in as owner', async () => {
  await page.getByRole('link', { name: 'Zaloguj się' }).click();
  await page.getByRole('button', { name: 'Rejestracja' }).click();
  await page.getByRole('textbox', { name: 'twoj@email.com' }).fill(emailOwner);
  await page.getByRole('textbox', { name: '••••••••' }).fill(passwordOwner);
  await page.getByRole('textbox', { name: 'jan_kowalski' }).fill(loginOwner);
  await page.getByRole('textbox', { name: 'Jan Kowalski' }).fill(nameOwner);
  await page.getByText('🏠WłaścicielWynajmuję pokoje').click();
  await page.getByRole('textbox', { name: '+48 123 456' }).fill(phoneOwner);
  await page.getByRole('button', { name: 'Zarejestruj' }).click();
});
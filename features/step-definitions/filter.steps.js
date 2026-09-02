const { Given, When, Then, Before, After } = require('@cucumber/cucumber');
const { chromium, expect } = require('@playwright/test');

let browser;
let page;


const street = 'ul. Bukszpanowa 2';
const title = 'Miły pokój w centrum';
const city = 'Wrocław';

Before(async () => {
  browser = await chromium.launch({
    headless: false
  });

  page = await browser.newPage();
});

After(async () => {
  await browser.close();
});

Given('user open main page', async () => {
           await page.goto('http://localhost:3000/');
         });

 When('user click at scope icon', async () => {
           await page.getByRole('button', { name: 'Szukaj' }).click();
         });

When('user filter out properties', async () => {
            await page.getByRole('textbox', { name: 'np. Warszawa' }).click();
            await page.getByRole('textbox', { name: 'np. Warszawa' }).fill(city);
            await page.locator('input[name="minPrice"]').click();
            await page.locator('input[name="minPrice"]').fill('1200');
            await page.locator('input[name="minArea"]').click();
            await page.locator('input[name="minArea"]').fill('12');
            await page.getByRole('checkbox', { name: '🐾 Zwierzęta' }).check();
            await page.getByRole('checkbox', { name: '🚗 Parking' }).check();
            await page.getByRole('checkbox', { name: '🏠 Balkon' }).check();
            await page.getByRole('complementary').getByRole('button', { name: 'Szukaj' }).click();
         });

Then('user should see only {string} room', async (title) => {
           await expect(page.getByRole('heading', { name: title })).toBeVisible();
         });
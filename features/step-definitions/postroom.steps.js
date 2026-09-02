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

Given('user open login page', async () => {
    await page.goto('http://localhost:3000/login');
});

When('user login into account with valid credentials', async () => {
    await page.getByRole('textbox', { name: 'twoj@email.com' }).click();
    await page.getByRole('textbox', { name: 'twoj@email.com' }).fill('admin@admin.pl');
    await page.getByRole('textbox', { name: '••••••••' }).click();
    await page.getByRole('textbox', { name: '••••••••' }).fill('123');
    await page.getByRole('button', { name: 'Zaloguj' }).click();
         });

When('user click Panel button', async () => {
           await page.getByRole('link', { name: 'Panel' }).click();
         });

When('user delete already existing room', async () => {
    await page.getByRole('link', { name: 'Panel' }).click();
        page.on('dialog', async dialog => {
        await dialog.accept(); 
        });
    await page.getByRole('button', { name: '🗑️ Usuń' }).click();
});         
        


When('user click Dodaj ogloszenie button', async () => {
           await page.getByRole('button', { name: '+ Dodaj ogłoszenie' }).click();
         });

 When('user fill room\'s form with valid credentials', async () => {
            await page.getByRole('textbox', { name: 'np. Przytulny pokój w centrum' }).click();
            await page.getByRole('textbox', { name: 'np. Przytulny pokój w centrum' }).fill(title);
            await page.getByRole('textbox', { name: 'ul. Przykładowa' }).click();
            await page.getByRole('textbox', { name: 'ul. Przykładowa' }).fill(street);
            await page.getByRole('textbox', { name: 'Warszawa' }).click();
            await page.getByRole('textbox', { name: 'Warszawa' }).fill(city);
            await page.getByPlaceholder('1500').click();
            await page.getByPlaceholder('1500').fill('1200');
            await page.getByPlaceholder('15', { exact: true }).click();
            await page.getByPlaceholder('15', { exact: true }).fill('12');
            await page.getByRole('checkbox', { name: '🐾 Zwierzęta' }).check();
            await page.getByRole('checkbox', { name: '🚗 Parking' }).check();
            await page.getByRole('checkbox', { name: 'Balkon' }).click();
            await page.getByRole('textbox', { name: 'Opisz pokój...' }).click();
            await page.getByRole('textbox', { name: 'Opisz pokój...' }).fill('Na wynajem miły pokój w centrum wrocławia');
            await page.getByRole('button', { name: 'Dodaj ogłoszenie' }).click();
         });

Then('room should be visible in dashboard', async () => {
            await expect(page.getByRole('heading', { name: title })).toBeVisible();
         });

 Then('room should be visible in main page', async () => {
            await page.getByRole('link', { name: 'CoRoom' }).click();
            await expect(page.locator('.room-location').first()).toContainText(`${city}, ${street}`);
         });
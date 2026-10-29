import path from 'node:path';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '..');
const target = `file:///${path.join(root, 'BelajarKode.html').replace(/\\/g, '/')}`;

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

await page.goto(target);
await page.fill('input[placeholder="Nama panggilan"]', 'Tamu');
await page.getByLabel(/Mulai tanpa PIN/).check();
await page.getByRole('button', { name: 'Buat profil' }).click();
await page.waitForTimeout(700);
const guestLoggedIn = await page.locator('.rail').isVisible();

await page.evaluate(() => {
  window.location.hash = '#/settings';
});
await page.waitForTimeout(500);
const upgradeVisible = (await page.locator('body').innerText()).includes('AKTIFKAN PIN');
const pins = page.locator('.pin-input input');
await pins.nth(0).click();
await page.keyboard.type('654321');
await pins.nth(6).click();
await page.keyboard.type('654321');
await page.getByRole('button', { name: 'Aktifkan PIN' }).click();
await page.waitForTimeout(900);

const guestAfter = await page.evaluate(() => {
  const profiles = JSON.parse(localStorage.getItem('bk.v2.profiles') || '{"profiles":[]}').profiles;
  return profiles[0]?.guest;
});

await page.locator('.rail-switch').click();
await page.waitForTimeout(500);
await page.locator('.profile-choice').first().click();
const loginPins = page.locator('.pin-input input');
await loginPins.nth(0).click();
await page.keyboard.type('654321');
await page.locator('.auth-form button[type="submit"]').click();
await page.waitForTimeout(900);
const pinLogin = await page.locator('.rail').isVisible();

console.log(JSON.stringify({ guestLoggedIn, upgradeVisible, guestAfter, pinLogin, errors }, null, 2));
await browser.close();

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
await page.evaluate(() => {
  localStorage.setItem(
    'belajarkode-user-v1',
    JSON.stringify({
      completed: ['m01-l01'],
      bookmarks: ['m01-l02'],
      notes: { 'm01-l01': 'catatan lama' },
      quizzes: { 'm01-l01': { choice: 0, correct: true } },
      theme: 'light',
      labMode: 'js',
      labCode: 'console.log("lama")',
      history: ['m01-l01'],
      dailyGoal: 2,
    }),
  );
});
await page.reload();
await page.waitForTimeout(700);

const legacyVisible = await page.getByLabel(/Pulihkan progres lama/).isVisible();
const legacyChecked = await page.getByLabel(/Pulihkan progres lama/).isChecked();

await page.fill('input[placeholder="Nama panggilan"]', 'Migrasi');
const pins = page.locator('.pin-input input');
await pins.nth(0).click();
await page.keyboard.type('123456');
await pins.nth(6).click();
await page.keyboard.type('123456');
await page.getByRole('button', { name: 'Buat profil' }).click();
await page.waitForTimeout(900);

const body = await page.locator('body').innerText();
const stored = await page.evaluate(() => {
  const profiles = JSON.parse(localStorage.getItem('bk.v2.profiles') || '{"profiles":[]}').profiles;
  const first = profiles[0];
  const state = JSON.parse(localStorage.getItem(`bk.v2.state.${first.id}`) || '{}');
  return {
    legacyStillThere: Boolean(localStorage.getItem('belajarkode-user-v1')),
    completed: state.completed,
    notes: state.notes,
    quiz: state.quizzes['m01-l01'],
    dailyGoal: state.dailyGoal,
    xp: Object.keys(state.xp || {}).length,
    profileCount: profiles.length,
  };
});

console.log(
  JSON.stringify(
    {
      target,
      legacyVisible,
      legacyChecked,
      showsProgress: /\b1\/\d+/.test(body) || /\b1 dari \d+/.test(body),
      stored,
      errors,
    },
    null,
    2,
  ),
);

await browser.close();

import path from 'node:path';
import fs from 'node:fs';
import { chromium } from 'playwright-core';

const root = path.resolve(import.meta.dirname, '..');
const target = `file:///${path.join(root, 'BelajarKode.html').replace(/\\/g, '/')}`;
const bookTarget = `file:///${path.join(root, 'buku-belajarkode.html').replace(/\\/g, '/')}`;
const gallery = process.env.BK_SCREENSHOT_DIR ?? path.join(root, '.smoke');
fs.mkdirSync(gallery, { recursive: true });

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});

const context = await browser.newContext({ acceptDownloads: true });
const page = await context.newPage({ viewport: { width: 1440, height: 900 } });
const logs = [];
page.on('console', (message) => {
  if (message.type() === 'error' || message.type() === 'warning') {
    logs.push(`[console:${message.type()}] ${message.text()}`);
  }
});
page.on('pageerror', (error) => logs.push(`[pageerror] ${error.message}`));

const shot = async (name) => {
  await page.screenshot({ path: path.join(gallery, `${name}.png`), fullPage: true });
};

const result = { target, steps: [], logs };

await page.goto(target);
await page.waitForTimeout(700);
await shot('01-login');

await page.fill('input[placeholder="Nama panggilan"]', 'Uji Coba');
let pins = page.locator('.pin-input input');
await pins.nth(0).click();
await page.keyboard.type('123456');
await pins.nth(6).click();
await page.keyboard.type('123456');
await page.getByRole('button', { name: 'Buat profil' }).click();
await page.waitForTimeout(900);
result.steps.push('buat profil');
await shot('02-base');

const go = async (hash, name) => {
  await page.evaluate((value) => {
    window.location.hash = value;
  }, hash);
  await page.waitForTimeout(420);
  await shot(name);
};

await go('#/mulai', '02b-start');
result.setupItems = await page.locator('.setup-check input').count();
await page.locator('.setup-check input').first().check();
await page.waitForTimeout(350);
result.setupProgress = await page.locator('.setup-hero strong').innerText();
await go('#/path', '03-path');
await go('#/modules', '04-modules');
await go('#/modules/m01', '05-module');
await go('#/lesson/m01-l01', '06-lesson');

await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(450);
result.readSections = await page.locator('.section-read').count();

await page.getByRole('button', { name: 'Tandai selesai' }).click();
await page.waitForTimeout(500);
const lessonBody = await page.locator('body').innerText();
result.steps.push('tandai selesai');
result.lessonMarked = lessonBody.includes('Batalkan selesai');

await page.locator('.quiz-option').first().click();
await page.waitForTimeout(400);
result.quizFeedback = await page.locator('.quiz-feedback').first().innerText().catch(() => '');
await shot('07-lesson-answered');

await go('#/lab', '08-lab');
await page.getByRole('button', { name: /Jalankan kode/ }).click();
await page.waitForTimeout(1200);
result.labOutput = await page.locator('.lab-output').innerText().catch(() => '');
await shot('09-lab-run');

await go('#/lexicon', '10-lexicon');
await go('#/saved', '11-saved');
await go('#/achievements', '12-achievements');
await go('#/settings', '13-settings');

// Reload: sesi tab harus bertahan.
await page.reload();
await page.waitForTimeout(900);
result.reloadKeptSession = await page.locator('.rail').isVisible();
await shot('14-after-reload');

// Logout lewat menu profil, lalu masuk kembali dengan PIN.
await page.locator('.profile-trigger').click();
await page.waitForTimeout(250);
result.profileMenuOpen = await page.locator('.profile-dropdown').isVisible();
await page.getByRole('menuitem', { name: 'Ganti profil' }).click();
await page.waitForTimeout(500);
result.logoutShowsPicker = await page.locator('.profile-choice').first().isVisible();
await shot('15-profiles');
await page.locator('.profile-choice').first().click();
pins = page.locator('.pin-input input');
await pins.nth(0).click();
await page.keyboard.type('123456');
await page.locator('.auth-form button[type="submit"]').click();
await page.waitForTimeout(900);
result.loginWithPin = await page.locator('.rail').isVisible();
await shot('15b-login-again');

// Ekspor backup.
await page.evaluate(() => {
  window.location.hash = '#/settings';
});
await page.waitForTimeout(500);
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: /Unduh cadangan/ }).click();
const download = await downloadPromise;
const backupPath = path.join(gallery, 'backup.json');
await download.saveAs(backupPath);
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
result.backup = { schema: backup.schema, completed: backup.data.completed.length, format: backup.format };

// Impor backup yang sama.
page.on('download', (extra) => {
  extra.saveAs(path.join(gallery, `import-${Date.now()}.json`)).catch(() => {});
});
await page.locator('input[type="file"]').setInputFiles(backupPath);
await page.waitForTimeout(400);
const dialogOpen = await page.locator('.confirm-dialog').isVisible();
result.importDialog = dialogOpen;
if (dialogOpen) {
  await page.getByRole('button', { name: 'Pulihkan', exact: true }).click();
  await page.waitForTimeout(900);
}
result.imported = (await page.locator('body').innerText()).includes('Cadangan berhasil dipulihkan');
await shot('16-after-import');

// Mobile.
await page.setViewportSize({ width: 390, height: 844 });
await go('#/', '17-mobile-base');
result.mobileOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth,
);
await go('#/mulai', '17a-mobile-start');
result.mobileStartOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth,
);
await page.locator('.menu-btn').click();
await page.waitForTimeout(350);
result.mobileMenu = await page.locator('.rail.is-open').isVisible();
await shot('17b-mobile-menu');
await page.keyboard.press('Escape');
await go('#/lesson/m01-l01', '18-mobile-lesson');

// Search.
await page.setViewportSize({ width: 1440, height: 900 });
await page.evaluate(() => {
  window.location.hash = '#/';
});
await page.keyboard.press('/');
await page.waitForTimeout(300);
await page.keyboard.type('variabel');
await page.waitForTimeout(300);
await shot('19-search');
result.searchResults = await page.locator('.search-result').count();
await page.keyboard.press('Escape');

// Buku offline.
const book = await context.newPage({ viewport: { width: 1440, height: 900 } });
const bookLogs = [];
book.on('pageerror', (error) => bookLogs.push(String(error.message)));
book.on('console', (message) => {
  if (message.type() === 'error') bookLogs.push(message.text());
});
await book.goto(bookTarget);
await book.waitForTimeout(600);
result.book = {
  lessons: await book.locator('section.module[id^="m"] article.lesson').count(),
  modules: await book.locator('section.module[id^="m"]').count(),
  appendices: await book.locator('#mendalam #pendalaman-5').count(),
  title: await book.title(),
  logs: bookLogs,
};
await book.screenshot({ path: path.join(gallery, '20-book.png'), fullPage: false });
await book.locator('#mendalam').scrollIntoViewIfNeeded();
await book.waitForTimeout(300);
await book.screenshot({ path: path.join(gallery, '21-book-deep.png'), fullPage: false });

const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
const mobileLogin = await mobileContext.newPage();
await mobileLogin.goto(target);
await mobileLogin.waitForTimeout(600);
result.mobileLoginOverflow = await mobileLogin.evaluate(
  () => document.documentElement.scrollWidth - window.innerWidth,
);
await mobileLogin.screenshot({ path: path.join(gallery, '22-mobile-login.png'), fullPage: true });
await mobileContext.close();

result.profileCount = await page.evaluate(() => {
  const stored = localStorage.getItem('bk.v2.profiles');
  return stored ? JSON.parse(stored).profiles.length : 0;
});

result.storedProgress = await page.evaluate(() => {
  const profiles = JSON.parse(localStorage.getItem('bk.v2.profiles') || '{"profiles":[]}').profiles;
  if (!profiles[0]) return null;
  const state = JSON.parse(localStorage.getItem(`bk.v2.state.${profiles[0].id}`) || '{}');
  return {
    setupItems: state.setup?.completed?.length ?? 0,
    readingSections: Object.values(state.reading ?? {}).reduce(
      (sum, entry) => sum + (entry.sections?.length ?? 0),
      0,
    ),
    quizCorrect: Object.values(state.quizzes ?? {}).filter((entry) => entry.correct).length,
  };
});

console.log(JSON.stringify(result, null, 2));
await browser.close();


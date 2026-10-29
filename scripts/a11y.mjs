import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

const require = createRequire(import.meta.url);
const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const root = path.resolve(import.meta.dirname, '..');
const target = `file:///${path.join(root, 'BelajarKode.html').replace(/\\/g, '/')}`;

const browser = await chromium.launch({
  executablePath:
    process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(target);
await page.waitForTimeout(700);

async function audit(name) {
  await page.addScriptTag({ content: axeSource });
  const result = await page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
  });
  return {
    name,
    violations: result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.slice(0, 4).map((node) => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    })),
  };
}

const reports = [];
reports.push(await audit('login'));

await page.fill('input[placeholder="Nama panggilan"]', 'Axe Uji');
const pins = page.locator('.pin-input input');
await pins.nth(0).click();
await page.keyboard.type('123456');
await pins.nth(6).click();
await page.keyboard.type('123456');
await page.getByRole('button', { name: 'Buat profil' }).click();
await page.waitForTimeout(800);
await page.evaluate(() => {
  document.documentElement.dataset.motion = 'reduce';
});

for (const route of ['#/', '#/mulai', '#/path', '#/modules', '#/modules/m01', '#/lesson/m01-l01', '#/lesson/m05-l02', '#/lesson/m03-l01', '#/lesson/m03-l03', '#/lab', '#/lexicon', '#/achievements', '#/settings']) {
  await page.evaluate((value) => {
    window.location.hash = value;
  }, route);
  await page.waitForTimeout(350);
  reports.push(await audit(route));
}

for (const mode of ['terang', 'malam']) {
  await page.evaluate((appearance) => {
    document.documentElement.dataset.appearance = appearance;
    document.documentElement.dataset.contrast = 'normal';
  }, mode);
  for (const route of ['#/', '#/lesson/m01-l01', '#/lesson/m05-l02', '#/lesson/m03-l01', '#/lesson/m03-l03', '#/settings']) {
    await page.evaluate((value) => {
      window.location.hash = value;
    }, route);
    await page.waitForTimeout(350);
    reports.push(await audit(`${mode} ${route}`));
  }
}

await page.evaluate(() => {
  document.documentElement.dataset.appearance = 'nyaman';
  document.documentElement.dataset.contrast = 'high';
});
for (const route of ['#/', '#/lesson/m01-l01', '#/lesson/m05-l02', '#/lesson/m03-l01', '#/lesson/m03-l03']) {
  await page.evaluate((value) => {
    window.location.hash = value;
  }, route);
  await page.waitForTimeout(350);
  reports.push(await audit(`high contrast ${route}`));
}

await page.evaluate(() => {
  document.documentElement.dataset.appearance = 'nyaman';
  document.documentElement.dataset.contrast = 'normal';
});

await page.setViewportSize({ width: 390, height: 844 });
for (const route of ['#/', '#/mulai', '#/lesson/m01-l01', '#/lesson/m03-l03']) {
  await page.evaluate((value) => {
    window.location.hash = value;
  }, route);
  await page.waitForTimeout(350);
  reports.push(await audit(`mobile ${route}`));
}

const outDir = path.join(root, '.smoke');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'a11y.json'), `${JSON.stringify(reports, null, 2)}\n`, 'utf8');

for (const report of reports) {
  if (!report.violations.length) {
    console.log(`ok ${report.name}`);
    continue;
  }
  console.log(`## ${report.name}`);
  for (const violation of report.violations) {
    console.log(`- ${violation.impact} ${violation.id}: ${violation.help}`);
    for (const node of violation.nodes) {
      console.log(`    ${node.target.join(' ')}`);
    }
  }
}

await browser.close();

import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const index = JSON.parse(fs.readFileSync(path.join(root, 'content', 'index.json'), 'utf8'));
const sources = Array.isArray(index.sources) ? index.sources : [];

const errors = [];
const warnings = [];
const timeoutMs = Number(process.env.SOURCE_TIMEOUT_MS) || 15000;
const concurrency = Math.max(1, Number(process.env.SOURCE_CONCURRENCY) || 6);

async function checkSource(source) {
  if (!source.id || !source.url) {
    errors.push(`${source.id || '(tanpa id)'}: id atau URL kosong.`);
    return;
  }

  let parsed;
  try {
    parsed = new URL(source.url);
  } catch {
    errors.push(`${source.id}: URL tidak valid (${source.url}).`);
    return;
  }
  if (parsed.protocol !== 'https:') {
    errors.push(`${source.id}: URL wajib HTTPS (${source.url}).`);
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(source.url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; BelajarKodeSourceCheck/1.0)',
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    if (response.body) await response.body.cancel();

    if (response.status === 403 || response.status === 429) {
      warnings.push(`${source.id}: ${response.status} ${response.statusText} (kemungkinan proteksi bot).`);
      return;
    }
    if (!response.ok) {
      errors.push(`${source.id}: ${response.status} ${response.statusText} (${source.url}).`);
      return;
    }
    console.log(`OK ${source.id} (${response.status})`);
  } catch (error) {
    const reason = error?.name === 'AbortError' ? `timeout ${timeoutMs} ms` : error.message;
    errors.push(`${source.id}: ${reason} (${source.url}).`);
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  if (!sources.length) {
    console.error('Registry sumber kosong.');
    process.exitCode = 1;
    return;
  }

  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, sources.length) }, async () => {
    while (cursor < sources.length) {
      const source = sources[cursor];
      cursor += 1;
      await checkSource(source);
    }
  });
  await Promise.all(workers);

  for (const warning of warnings) console.warn(`PERINGATAN: ${warning}`);

  if (errors.length) {
    console.error(`\n${errors.length} sumber bermasalah:`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log(
    `Sumber valid: ${sources.length} tautan diperiksa${warnings.length ? `, ${warnings.length} peringatan` : ''}.`,
  );
}

run();

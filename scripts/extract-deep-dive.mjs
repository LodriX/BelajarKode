import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(root, 'buku-belajarkode.html');
const outDir = path.join(root, 'book', 'deep-dive');

if (!fs.existsSync(sourcePath)) {
  console.error('buku-belajarkode.html tidak ditemukan.');
  process.exit(1);
}

const source = fs.readFileSync(sourcePath, 'utf8');
fs.mkdirSync(outDir, { recursive: true });

function findBlockEnd(html, start) {
  const tag = /<div\b|<\/div>/gi;
  tag.lastIndex = start;
  let depth = 0;
  let match;
  while ((match = tag.exec(html))) {
    if (match[0].toLowerCase().startsWith('<div')) depth += 1;
    else depth -= 1;
    if (depth === 0) return match.index + match[0].length;
  }
  return -1;
}

const blocks = [];
const opener = /<div id="pendalaman-(\d+)">/g;
let match;
while ((match = opener.exec(source))) {
  const start = match.index;
  const end = findBlockEnd(source, start);
  if (end < 0) {
    console.error(`Blok pendalaman-${match[1]} tidak tertutup rapi.`);
    process.exit(1);
  }
  blocks.push({ number: Number(match[1]), html: source.slice(start, end) });
  opener.lastIndex = end;
}

if (blocks.length !== 5) {
  console.error(`Diharapkan 5 blok pendalaman, ditemukan ${blocks.length}.`);
  process.exit(1);
}

for (const block of blocks) {
  if (block.html.length < 1000) {
    console.error(`Blok pendalaman-${block.number} terlalu pendek (${block.html.length} karakter).`);
    process.exit(1);
  }
  const file = path.join(outDir, `${String(block.number).padStart(2, '0')}.html`);
  fs.writeFileSync(file, `${block.html}\n`, 'utf8');
  console.log(`ditulis ${path.relative(root, file)} (${block.html.length} karakter)`);
}

fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  `${JSON.stringify(blocks.map((b) => ({ number: b.number, bytes: Buffer.byteLength(b.html) })), null, 2)}\n`,
  'utf8',
);

console.log(`Selesai: ${blocks.length} blok pendalaman diekstrak.`);

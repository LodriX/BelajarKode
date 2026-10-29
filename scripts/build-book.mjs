import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const curriculum = JSON.parse(fs.readFileSync(path.join(root, 'data', 'curriculum.json'), 'utf8'));
const css = fs.readFileSync(path.join(root, 'book', 'book.css'), 'utf8');
const deepDiveDir = path.join(root, 'book', 'deep-dive');
const outDir = path.join(root, 'public');

const deepDiveFiles = fs
  .readdirSync(deepDiveDir)
  .filter((name) => /^\d{2}\.html$/.test(name))
  .sort();

if (deepDiveFiles.length !== 5) {
  console.error(`Diharapkan 5 berkas pendalaman, ditemukan ${deepDiveFiles.length}.`);
  process.exit(1);
}

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);

const lessonCount = curriculum.modules.reduce((sum, module) => sum + module.lessons.length, 0);
if (lessonCount === 0) {
  console.error('Kurikulum tidak memiliki pelajaran.');
  process.exit(1);
}

const weeksLabel = (weeks) => (weeks.length === 1 ? `Minggu ${weeks[0]}` : `Minggu ${weeks[0]}–${weeks[weeks.length - 1]}`);

const LANGUAGE_LABELS = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  bash: 'Bash',
  sql: 'SQL',
  php: 'PHP',
  dart: 'Dart',
  jsx: 'JSX',
  yaml: 'YAML',
  http: 'HTTP',
  text: 'Teks',
};

const PRACTICE_LABELS = {
  guided: 'Terbimbing',
  independent: 'Mandiri',
  transfer: 'Penerapan',
};

const VERIFICATION_LABELS = {
  lab: 'Lab kode',
  browser: 'Browser',
  terminal: 'Terminal',
  manual: 'Manual',
};

function renderLesson(lesson, index) {
  const language = LANGUAGE_LABELS[lesson.codeLanguage] ?? lesson.codeLanguage;
  const outcome = lesson.outcome
    ? `<div class="panel good"><b>Hasil belajar</b><p>${esc(lesson.outcome)}</p></div>`
    : '';
  const objectives = lesson.objectives?.length
    ? `<h4>Tujuan</h4><ul>${lesson.objectives.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
    : '';
  const prerequisites = lesson.prerequisites?.length
    ? `<div class="panel"><b>Prasyarat</b>${lesson.prerequisites
        .map((item) => `<p>${esc(item.label)}</p>`)
        .join('')}</div>`
    : '';
  const terms = lesson.terms?.length
    ? `<h4>Istilah kunci</h4><dl class="glossary">${lesson.terms
        .map((term) => `<div><dt>${esc(term.term)}</dt><dd>${esc(term.definition)}</dd></div>`)
        .join('')}</dl>`
    : '';
  const syntax = lesson.syntax?.length
    ? `<h4>Kartu sintaks</h4>${lesson.syntax
        .map(
          (item) => `<div class="panel">
  <b><code>${esc(item.token)}</code></b>
  ${item.readAs ? `<p><em>Dibaca: ${esc(item.readAs)}</em></p>` : ''}
  <p>${esc(item.meaning)}</p>
  <pre><code>${esc(item.example)}</code></pre>
  ${item.output ? `<p><em>Output: ${esc(item.output)}</em></p>` : ''}
  ${item.pitfall ? `<p><em>Hati-hati: ${esc(item.pitfall)}</em></p>` : ''}
</div>`,
        )
        .join('')}`
    : '';
  const conventions = lesson.conventions?.length
    ? `<h4>Aturan penulisan</h4><ul>${lesson.conventions
        .map((item) => `<li>${esc(item)}</li>`)
        .join('')}</ul>`
    : '';

  const sections = (lesson.sections ?? [])
    .map((section, sectionIndex) => {
      const annotations = section.code?.annotations?.length
        ? `<div class="panel"><b>Bedah baris</b><ol>${section.code.annotations
            .map(
              (annotation) =>
                `<li>Baris ${esc(annotation.line)}${
                  annotation.code ? ` · <code>${esc(annotation.code)}</code>` : ''
                } — ${esc(annotation.note)}</li>`,
            )
            .join('')}</ol></div>`
        : '';
      return `<section class="lesson-section">
  <h4>${String(sectionIndex + 1).padStart(2, '0')} · ${esc(section.title)}</h4>
  ${(section.body ?? []).map((paragraph) => `<p>${esc(paragraph)}</p>`).join('')}
  ${
    section.code
      ? `<pre><code>${esc(section.code.code)}</code></pre>${
          section.code.output
            ? `<div class="panel"><b>Output yang diharapkan</b><p>${esc(section.code.output)}</p></div>`
            : ''
        }${section.code.explain ? `<p>${esc(section.code.explain)}</p>` : ''}${annotations}`
      : ''
  }
  ${(section.callouts ?? [])
    .map(
      (callout) =>
        `<div class="panel ${callout.tone === 'bad' ? 'bad' : callout.tone === 'warn' ? 'warn' : 'good'}"><b>${esc(
          callout.title || 'Catatan',
        )}</b><p>${esc(callout.body)}</p></div>`,
    )
    .join('')}
  ${
    section.checkpoint?.prompt
      ? `<div class="panel warn"><b>Cek pemahaman</b><p>${esc(section.checkpoint.prompt)}</p>${
          section.checkpoint.success
            ? `<p>Kriteria berhasil: ${esc(section.checkpoint.success)}</p>`
            : ''
        }</div>`
      : ''
  }
</section>`;
    })
    .join('');

  const practice = (lesson.practice ?? [])
    .map(
      (item) => `<li><b>${esc(item.title || 'Latihan')}</b>${
        item.level ? ` <em>(${esc(PRACTICE_LABELS[item.level] ?? item.level)})</em>` : ''
      }<p>${esc(item.task)}</p>${
        item.steps?.length
          ? `<ol>${item.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol>`
          : ''
      }${item.starterCode ? `<pre><code>${esc(item.starterCode)}</code></pre>` : ''}${
        item.expected ? `<p><em>Hasil: ${esc(item.expected)}</em></p>` : ''
      }${
        item.hints?.length
          ? `<details><summary>Petunjuk bertahap</summary><ol>${item.hints
              .map((hint) => `<li>${esc(hint)}</li>`)
              .join('')}</ol></details>`
          : ''
      }${item.hint ? `<p><em>Petunjuk: ${esc(item.hint)}</em></p>` : ''}${
        item.stretch ? `<p><em>Tantangan: ${esc(item.stretch)}</em></p>` : ''
      }</li>`,
    )
    .join('');

  const verification = lesson.verification
    ? `<h4>Verifikasi</h4><div class="panel"><b>Mode: ${esc(
        VERIFICATION_LABELS[lesson.verification.mode] ?? lesson.verification.mode,
      )}</b>${
        lesson.verification.command
          ? `<pre><code>${esc(lesson.verification.command)}</code></pre>`
          : ''
      }${
        lesson.verification.expected
          ? `<p><em>Hasil yang diharapkan: ${esc(lesson.verification.expected)}</em></p>`
          : ''
      }${
        lesson.verification.evidence
          ? `<p><em>Bukti yang disimpan: ${esc(lesson.verification.evidence)}</em></p>`
          : ''
      }</div>`
    : '';

  const troubleshooting = lesson.troubleshooting?.length
    ? `<h4>Mengatasi masalah</h4><ul>${lesson.troubleshooting
        .map(
          (item) =>
            `<li><b>${esc(item.symptom)}</b>${
              item.cause ? `<br>Penyebab umum: ${esc(item.cause)}` : ''
            }${item.fix ? `<br>Perbaikan: ${esc(item.fix)}` : ''}</li>`,
        )
        .join('')}</ul>`
    : '';

  const summary = lesson.summary?.length
    ? `<h4>Ringkasan</h4><ul>${lesson.summary.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
    : '';
  const next = lesson.next ? `<div class="panel"><b>Berikutnya</b><p>${esc(lesson.next)}</p></div>` : '';

  const resources = lesson.resources?.length
    ? `<h4>Sumber</h4><ul>${lesson.resources
        .map(
          (resource) =>
            `<li><a href="${esc(resource.url)}" rel="noopener noreferrer">${esc(resource.title)}</a>${
              resource.publisher
                ? ` <small>${esc(resource.publisher)}${
                    resource.version ? ` · ${esc(resource.version)}` : ''
                  }</small>`
                : ''
            }${resource.note ? ` — ${esc(resource.note)}` : ''}</li>`,
        )
        .join('')}</ul>`
    : '';

  const quiz = (lesson.quiz?.questions ?? [])
    .map(
      (question, questionIndex) => `<div class="quiz-question">
    <b>${questionIndex + 1}. ${esc(question.question)}</b>
    <ol type="A">${question.options
      .map((option) => `<li>${esc(option)}</li>`)
      .join('')}</ol>
    <details><summary>Lihat pembahasan</summary><p class="answer">Jawaban: ${String.fromCharCode(
      65 + question.answer,
    )}. ${esc(question.explanation)}</p></details>
  </div>`,
    )
    .join('');

  return `<article class="lesson" id="${esc(lesson.id)}">
  <div class="lesson-meta">Pelajaran ${String(index + 1).padStart(2, '0')} · ${esc(lesson.minutes)} menit · ${esc(lesson.level)} · ${esc(language)}</div>
  <h3>${esc(lesson.title)}</h3>
  ${outcome}
  ${objectives}
  ${prerequisites}
  ${terms}
  ${syntax}
  ${conventions}
  ${sections}
  ${practice ? `<h4>Latihan bertingkat</h4><ol>${practice}</ol>` : ''}
  ${verification}
  ${troubleshooting}
  <div class="quiz"><strong>Uji pemahaman</strong>${quiz}</div>
  ${summary}
  ${next}
  ${resources}
</article>`;
}

function renderModule(module) {
  return `<section class="module" id="${esc(module.id)}">
  <div class="module-head">
    <span class="pill">${esc(module.id.toUpperCase())} · ${esc(weeksLabel(module.weeks))}</span>
    <h2>${esc(module.title)}</h2>
  </div>
  <p class="subtitle">${esc(module.subtitle)}</p>
  <div class="panel"><b>Tujuan modul</b><p>${esc(module.goal)}</p></div>
  ${module.lessons.map((lesson, i) => renderLesson(lesson, i)).join('\n')}
</section>`;
}

const tocModules = curriculum.modules
  .map(
    (module) =>
      `<a href="#${esc(module.id)}">${esc(module.id.toUpperCase())} · ${esc(module.title)}</a>`,
  )
  .join('');

const tocLessons = curriculum.modules
  .map(
    (module) =>
      `<div class="group">${esc(module.id.toUpperCase())}</div>` +
      module.lessons
        .map((lesson) => `<a href="#${esc(lesson.id)}">${esc(lesson.title)}</a>`)
        .join(''),
  )
  .join('');

const roadmap = curriculum.roadmap
  .map(
    (week) =>
      `<tr><td>${esc(week.week)}</td><td>${esc(week.focus)}</td><td>${esc(week.deliverable)}</td></tr>`,
  )
  .join('');

const tools = curriculum.tools
  .map(
    (tool) =>
      `<tr><td>${esc(tool.category)}</td><td><a href="${esc(tool.official)}" rel="noopener noreferrer">${esc(tool.name)}</a></td><td>${esc(tool.purpose)}</td></tr>`,
  )
  .join('');

const projects = curriculum.projects
  .map(
    (project) => `<article class="lesson">
  <div class="lesson-meta">${esc(project.phase)}</div>
  <h3>${esc(project.title)}</h3>
  <p>${esc(project.description)}</p>
  <h4>Kriteria penerimaan</h4>
  <ul>${project.acceptance.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>
</article>`,
  )
  .join('');

const glossary = curriculum.glossary
  .map((entry) => `<div><dt>${esc(entry.term)}</dt><dd>${esc(entry.definition)}</dd></div>`)
  .join('');

const sources = curriculum.sources
  .map(
    (source) =>
      `<li><a href="${esc(source.url)}" rel="noopener noreferrer">${esc(source.title)}</a>${
        source.publisher ? ` <small>${esc(source.publisher)}` : ''
      }${source.version ? ` · ${esc(source.version)}` : ''}${
        source.publisher ? '</small>' : ''
      }</li>`,
  )
  .join('');

const deepDives = deepDiveFiles
  .map((file) => fs.readFileSync(path.join(deepDiveDir, file), 'utf8'))
  .join('\n');

const html = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>Buku Belajar Pemrograman — BelajarKode</title>
<style>${css}</style>
</head>
<body id="top">
<div class="layout">
  <aside class="toc">
    <div class="brand">BelajarKode</div>
    <div class="edition">Buku offline · ${esc(curriculum.updated)}</div>
    <a class="back" href="./" onclick="if(location.protocol==='file:'){this.href='BelajarKode.html'}">← Buka aplikasi</a>
    <div class="group">Ikhtisar</div>
    <a href="#top">Sampul</a>
    <a href="#cara-pakai">Cara memakai buku</a>
    <a href="#roadmap">Rencana ${curriculum.roadmap.length} minggu</a>
    <a href="#alat">Daftar alat</a>
    <div class="group">Modul</div>
    ${tocModules}
    <div class="group">Lampiran</div>
    <a href="#proyek">Proyek praktik</a>
    <a href="#glosarium">Kamus istilah</a>
    <a href="#referensi">Sumber resmi</a>
    <a href="#mendalam">Bacaan pendalaman</a>
    <div class="group">Pelajaran</div>
    ${tocLessons}
  </aside>

  <main class="paper">
    <header class="cover">
      <div class="tag">Mandiri · Portabel · Offline</div>
      <h1>Buku Belajar Pemrograman dari Nol hingga Web dan Mobile</h1>
      <p>${esc(curriculum.summary)}</p>
      <p>${esc(curriculum.disclaimer)}</p>
      <div class="meta">
        <span>${curriculum.modules.length} MODUL</span>
        <span>${lessonCount} PELAJARAN</span>
        <span>${curriculum.roadmap.length} MINGGU</span>
        <span>EDISI ${esc(curriculum.updated)}</span>
      </div>
    </header>

    <p class="lead">Mulai dari logika dan JavaScript, lanjut ke HTML/CSS, TypeScript, Git, SQL/PostgreSQL, PHP/Laravel, REST API, Dart/Flutter, lalu praktik keamanan dan deployment. Ketik sendiri contohnya, kerjakan latihan, dan uji pemahaman di akhir setiap pelajaran.</p>

    <section id="cara-pakai">
      <h2>Cara memakai buku</h2>
      <ol>
        <li>Baca satu pelajaran, lalu tutup buku dan jelaskan ulang konsepnya dengan bahasa sendiri.</li>
        <li>Ketik ulang contoh kode, jalankan, lalu ubah satu input untuk melihat perbedaannya.</li>
        <li>Kerjakan latihan tanpa melihat jawaban. Setelah itu baru bandingkan dengan pembahasan kuis.</li>
        <li>Gunakan aplikasi BelajarKode untuk menandai progres, menyimpan catatan, dan menjalankan Lab kode.</li>
        <li>Untuk mencetak atau menyimpan PDF pribadi, gunakan menu Print browser. Tidak perlu konverter daring.</li>
      </ol>
    </section>

    <section id="roadmap">
      <h2>Rencana ${curriculum.roadmap.length} minggu</h2>
      <p>Alokasi contoh 4–5 jam per minggu. Waktu adalah perkiraan; ukur hasil dari artefak dan kemampuan menjelaskan keputusan teknis.</p>
      <table>
        <thead><tr><th>Pekan</th><th>Fokus</th><th>Hasil praktik</th></tr></thead>
        <tbody>${roadmap}</tbody>
      </table>
    </section>

    <section id="alat">
      <h2>Alat yang diperlukan</h2>
      <table>
        <thead><tr><th>Tahap</th><th>Alat</th><th>Fungsi</th></tr></thead>
        <tbody>${tools}</tbody>
      </table>
      <p>Materi dalam buku ini dapat dibaca offline. Memasang SDK, emulator, database, atau mengakses tautan resmi memerlukan persiapan dan koneksi terpisah.</p>
    </section>

    ${curriculum.modules.map(renderModule).join('\n')}

    <section class="module" id="proyek">
      <div class="module-head"><h2>Proyek praktik</h2></div>
      <p class="subtitle">Proyek berikut menjadi bukti kemampuan, bukan sekadar latar portofolio.</p>
      ${projects}
    </section>

    <section class="module" id="glosarium">
      <div class="module-head"><h2>Kamus istilah</h2></div>
      <p class="subtitle">${curriculum.glossary.length} istilah yang sering muncul di dokumentasi dan diskusi teknis.</p>
      <dl class="glossary">${glossary}</dl>
    </section>

    <section class="module" id="referensi">
      <div class="module-head"><h2>Sumber resmi</h2></div>
      <p class="subtitle">Versi teknologi berubah; periksa dokumentasi resmi dan tanggal pemeriksaan saat membuat proyek baru.</p>
      <ul>${sources}</ul>
    </section>

    <section class="appendix" id="mendalam">
      <h2>Lampiran: bacaan pendalaman</h2>
      <p class="lead">Bab berikut memberikan penjelasan lebih panjang mengenai perencanaan belajar dan dasar teknis. Bagian ini boleh dibaca bertahap setelah menyelesaikan modul terkait.</p>
      ${deepDives}
    </section>

    <div class="pagefooter">BelajarKode · buku offline · materi diperbarui ${esc(curriculum.updated)} · konten dapat berubah seiring pembaruan kurikulum.</div>
  </main>
</div>
</body>
</html>
`;

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'buku-belajarkode.html');
fs.writeFileSync(outFile, html, 'utf8');
console.log(`Buku ditulis: ${path.relative(root, outFile)} (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB)`);
console.log(`  ${curriculum.modules.length} modul · ${lessonCount} pelajaran · ${deepDiveFiles.length} blok pendalaman`);

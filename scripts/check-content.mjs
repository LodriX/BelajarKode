import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const curriculumFile = path.join(root, 'data', 'curriculum.json');
const indexFile = path.join(root, 'content', 'index.json');
const errors = [];
const warnings = [];
const fail = (message) => errors.push(message);
const warn = (message) => warnings.push(message);

const curriculum = JSON.parse(fs.readFileSync(curriculumFile, 'utf8'));
const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
const policy = index.contentPolicy ?? {};
const sourcePolicy = index.sourcePolicy ?? {};
const strictModules = new Set(policy.requireV2 ?? []);
const v3Lessons = new Set(policy.requireV3 ?? []);
const depthWordBands = policy.depthWordBands ?? {};
const wordsMin = Number(policy.wordsMin) || 1700;
const wordsTarget = Number(policy.wordsTarget) || 1800;
const requiredQuiz = Number(policy.quizQuestions) || 3;
const requiredPractice = Number(policy.practiceItems) || 3;
const requiredTroubleshooting = Number(policy.troubleshootingItems) || 3;
const sourceMin = Number(sourcePolicy.minPerLesson) || 2;
const sourceRequiredTiers = new Set(sourcePolicy.requireTier ?? ['standard', 'official']);
const sourceAllowedTiers = new Set(
  sourcePolicy.allowedTiers ?? ['standard', 'official', 'education', 'secondary'],
);
const requireAccessedAt = sourcePolicy.requireAccessedAt !== false;

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value ?? '') && !Number.isNaN(Date.parse(value));
}

const sources = Array.isArray(curriculum.sources) ? curriculum.sources : [];
const sourceById = new Map();
for (const source of sources) {
  if (!source.id) fail('Ada sumber tanpa id.');
  if (sourceById.has(source.id)) fail(`ID sumber duplikat: ${source.id}`);
  sourceById.set(source.id, source);
  if (!source.title) fail(`Sumber ${source.id || '(tanpa id)'}: judul kosong.`);
  if (!source.publisher) fail(`Sumber ${source.id || '(tanpa id)'}: publisher kosong.`);
  if (!isHttpsUrl(source.url)) fail(`Sumber ${source.id || '(tanpa id)'}: URL harus HTTPS.`);
  if (!sourceAllowedTiers.has(source.tier)) {
    fail(`Sumber ${source.id || '(tanpa id)'}: tier tidak dikenal (${source.tier || 'kosong'}).`);
  }
  if (requireAccessedAt && !isDate(source.accessedAt)) {
    fail(`Sumber ${source.id || '(tanpa id)'}: accessedAt harus tanggal YYYY-MM-DD.`);
  }
}

const moduleIds = new Set();
const lessonIds = new Set();
const modules = Array.isArray(curriculum.modules) ? curriculum.modules : [];
const targetWeeks = Number(curriculum.target?.weeks) || 0;
let totalLessons = 0;

if (!modules.length) fail('Kurikulum tidak memiliki modul.');
if (!Array.isArray(curriculum.roadmap) || curriculum.roadmap.length === 0) {
  fail('Roadmap kosong.');
} else if (targetWeeks && curriculum.roadmap.length !== targetWeeks) {
  fail(`Roadmap berisi ${curriculum.roadmap.length} minggu, target ${targetWeeks}.`);
}

for (const module of modules) {
  if (!module.id) fail('Ada modul tanpa id.');
  if (moduleIds.has(module.id)) fail(`ID modul duplikat: ${module.id}`);
  moduleIds.add(module.id);

  if (!module.title) fail(`${module.id}: judul modul kosong.`);
  if (!Array.isArray(module.weeks) || module.weeks.length === 0) {
    fail(`${module.id}: weeks harus berisi minimal satu minggu.`);
  }
  const roadmapWeeks = new Set((curriculum.roadmap ?? []).map((entry) => Number(entry.week)));
  for (const week of module.weeks ?? []) {
    if (!roadmapWeeks.has(Number(week))) {
      fail(`${module.id}: minggu ${week} tidak ada di roadmap.`);
    }
  }
  if (!Array.isArray(module.lessons) || module.lessons.length === 0) {
    fail(`${module.id}: tidak memiliki pelajaran.`);
    continue;
  }

  const strict = strictModules.has(module.id);
  const answers = [];

  for (const lesson of module.lessons) {
    totalLessons += 1;
    const v3 = v3Lessons.has(lesson.id);
    const reviewed = strict || v3;
    const label = `${module.id}/${lesson.id || '(tanpa id)'}`;
    if (!lesson.id) fail(`${module.id}: ada pelajaran tanpa id.`);
    if (lessonIds.has(lesson.id)) fail(`ID pelajaran duplikat: ${lesson.id}`);
    lessonIds.add(lesson.id);

    if (!lesson.title) fail(`${label}: judul kosong.`);
    if (!Number.isFinite(Number(lesson.minutes)) || Number(lesson.minutes) < 1) {
      fail(`${label}: minutes tidak valid.`);
    }
    if (!Array.isArray(lesson.sections) || lesson.sections.length === 0) {
      fail(`${label}: sections kosong.`);
    }
    const sectionIds = new Set();
    const reservedSections = new Set([
      'tujuan',
      'istilah',
      'sintaks',
      'praktik',
      'verifikasi',
      'kuis',
      'ringkasan',
      'troubleshooting',
      'referensi',
      'catatan',
    ]);
    for (const section of lesson.sections ?? []) {
      if (!section.id) fail(`${label}: ada section tanpa id.`);
      if (sectionIds.has(section.id)) fail(`${label}: id section duplikat (${section.id}).`);
      if (reservedSections.has(section.id)) {
        fail(`${label}: id section "${section.id}" bentrok dengan bagian bawaan.`);
      }
      sectionIds.add(section.id);
    }
    if (!lesson.quiz || !Array.isArray(lesson.quiz.questions) || lesson.quiz.questions.length === 0) {
      fail(`${label}: kuis tidak memiliki pertanyaan.`);
    }

    for (const question of lesson.quiz?.questions ?? []) {
      if (!question.question) fail(`${label}/${question.id}: pertanyaan kosong.`);
      if (!Array.isArray(question.options) || question.options.length < 2) {
        fail(`${label}/${question.id}: opsi kuis kurang dari dua.`);
      }
      if (
        !Number.isInteger(question.answer) ||
        question.answer < 0 ||
        question.answer >= (question.options?.length ?? 0)
      ) {
        fail(`${label}/${question.id}: indeks jawaban di luar opsi.`);
      }
      if (!question.explanation) fail(`${label}/${question.id}: pembahasan kosong.`);
      answers.push(question.answer);
    }

    if (!Array.isArray(lesson.practice) || lesson.practice.length === 0) {
      fail(`${label}: latihan kosong.`);
    }
    if (!Array.isArray(lesson.troubleshooting)) {
      fail(`${label}: troubleshooting harus berupa array.`);
    }
    if (!Array.isArray(lesson.resources)) {
      fail(`${label}: resources harus berupa array.`);
    } else {
      const resourceIds = new Set();
      const resourceUrls = new Set();
      for (const resource of lesson.resources) {
        if (!resource.title || !resource.url) {
          fail(`${label}: resource tanpa judul atau URL.`);
        }
        if (resource.sourceId) {
          if (!sourceById.has(resource.sourceId)) {
            fail(`${label}: sourceId tidak ditemukan (${resource.sourceId}).`);
          }
          if (resourceIds.has(resource.sourceId)) {
            fail(`${label}: sourceId duplikat (${resource.sourceId}).`);
          }
          resourceIds.add(resource.sourceId);
        } else if (reviewed) {
          fail(`${label}: resource wajib memakai sourceId dari registry.`);
        }
        if (resource.url) {
          if (resourceUrls.has(resource.url)) {
            fail(`${label}: URL sumber duplikat (${resource.url}).`);
          }
          resourceUrls.add(resource.url);
        }
      }
      if (reviewed) {
        if (lesson.resources.length < sourceMin) {
          fail(`${label}: butuh minimal ${sourceMin} sumber tepercaya.`);
        }
        if (!lesson.resources.some((resource) => sourceRequiredTiers.has(resource.tier))) {
          fail(`${label}: butuh minimal satu sumber bertier ${[...sourceRequiredTiers].join('/')}.`);
        }
      }
    }

    for (const prerequisite of lesson.prerequisites ?? []) {
      if (prerequisite.lessonId && !lessonIds.has(prerequisite.lessonId)) {
        // Prasyarat boleh menunjuk pelajaran yang didefinisikan setelahnya.
        const allIds = modules.flatMap((item) => item.lessons.map((entry) => entry.id));
        if (!allIds.includes(prerequisite.lessonId)) {
          fail(`${label}: prasyarat tidak ditemukan (${prerequisite.lessonId}).`);
        }
      }
    }

    if (!reviewed) continue;

    if (v3) {
      const band = depthWordBands[lesson.depth];
      if (!Array.isArray(band) || band.length !== 2) {
        fail(`${label}: depth "${lesson.depth}" tidak punya rentang kata.`);
      } else if (lesson.wordCount < band[0] || lesson.wordCount > band[1]) {
        fail(
          `${label}: ${lesson.wordCount} kata, di luar rentang ${lesson.depth} ${band[0]}-${band[1]}.`,
        );
      }
    } else if (lesson.wordCount < wordsMin) {
      fail(`${label}: ${lesson.wordCount} kata, minimum ${wordsMin}.`);
    } else if (lesson.wordCount < wordsTarget) {
      warn(`${label}: ${lesson.wordCount} kata, target ${wordsTarget}.`);
    }
    if ((lesson.quiz?.questions?.length ?? 0) < requiredQuiz) {
      fail(`${label}: butuh minimal ${requiredQuiz} pertanyaan kuis.`);
    }
    if ((lesson.practice?.length ?? 0) < requiredPractice) {
      fail(`${label}: butuh minimal ${requiredPractice} latihan.`);
    }
    if ((lesson.troubleshooting?.length ?? 0) < requiredTroubleshooting) {
      fail(`${label}: butuh minimal ${requiredTroubleshooting} troubleshooting.`);
    }
    if ((lesson.objectives?.length ?? 0) < 3) fail(`${label}: butuh minimal 3 objectives.`);
    if ((lesson.terms?.length ?? 0) < 3) fail(`${label}: butuh minimal 3 istilah.`);
    if (!lesson.checkpoint) {
      const hasCheckpoint = lesson.sections.some((section) => section.checkpoint?.prompt);
      if (!hasCheckpoint) fail(`${label}: tidak memiliki checkpoint.`);
    }
    if (!lesson.summary?.length) fail(`${label}: ringkasan kosong.`);

    if (v3) {
      if (![3, 3.1].includes(lesson.schema)) fail(`${label}: schema v3 belum diterapkan.`);
      if (!lesson.outcome) fail(`${label}: outcome kosong.`);
      if (!Array.isArray(lesson.syntax) || lesson.syntax.length < 2) {
        fail(`${label}: butuh minimal 2 kartu sintaks.`);
      }
      for (const item of lesson.syntax ?? []) {
        if (!item.token || !item.meaning || !item.example || !item.output || !item.pitfall) {
          fail(`${label}: kartu sintaks "${item.token || '(tanpa token)'}" belum lengkap.`);
        }
      }
      if (lesson.schema === 3.1) {
        if (!lesson.sections.some((section) => section.id === 'cara-membaca')) {
          fail(`${label}: schema 3.1 wajib punya bagian "cara-membaca".`);
        }
        if (!Array.isArray(lesson.conventions) || lesson.conventions.length < 3) {
          fail(`${label}: schema 3.1 butuh minimal 3 aturan penulisan.`);
        }
        if (!lesson.next) fail(`${label}: schema 3.1 wajib punya "next".`);
        for (const item of lesson.syntax ?? []) {
          if (!item.readAs) {
            fail(`${label}: kartu sintaks "${item.token}" belum punya cara baca (readAs).`);
          }
        }
        for (const section of lesson.sections ?? []) {
          if (!section.code) continue;
          const lineCount = String(section.code.code).split('\n').length;
          const codeLines = String(section.code.code).split('\n');
          if (!section.code.output || !section.code.explain) {
            fail(`${label}/${section.id}: blok kode 3.1 wajib punya output dan explain.`);
          }
          if (!Array.isArray(section.code.annotations) || section.code.annotations.length === 0) {
            fail(`${label}/${section.id}: blok kode 3.1 wajib punya bedah baris (annotations).`);
          }
          for (const annotation of section.code.annotations ?? []) {
            if (
              !Number.isInteger(annotation.line) ||
              annotation.line < 1 ||
              annotation.line > lineCount
            ) {
              fail(
                `${label}/${section.id}: anotasi baris ${annotation.line} di luar kode (${lineCount} baris).`,
              );
            }
            if (!annotation.code) {
              fail(`${label}/${section.id}: anotasi baris ${annotation.line} belum menyertakan potongan kode.`);
            } else if (
              annotation.line >= 1 &&
              annotation.line <= lineCount &&
              annotation.code.trim() !== codeLines[annotation.line - 1].trim()
            ) {
              fail(
                `${label}/${section.id}: potongan kode anotasi baris ${annotation.line} tidak sama dengan isi kode.`,
              );
            }
            if (!annotation.note) {
              fail(`${label}/${section.id}: anotasi baris ${annotation.line} belum punya penjelasan.`);
            }
          }
        }
      }
      if (!lesson.verification?.mode || !lesson.verification?.expected) {
        fail(`${label}: verifikasi latihan belum lengkap.`);
      }
      for (const item of lesson.practice ?? []) {
        if (!item.expected) fail(`${label}/${item.id}: expected latihan kosong.`);
        if (!Array.isArray(item.hints) || item.hints.length === 0) {
          fail(`${label}/${item.id}: butuh minimal satu hint bertahap.`);
        }
      }
    }

    const prose = JSON.stringify(lesson);
    if (/\b(kamu|kalian)\b/i.test(prose)) {
      fail(`${label}: gunakan sapaan formal "Anda", bukan "kamu/kalian".`);
    }
    if (/\b(TODO|TBD|lorem ipsum|placeholder)\b/i.test(prose)) {
      fail(`${label}: masih mengandung penanda placeholder.`);
    }
  }

  if (strict && answers.length > 1 && answers.every((answer) => answer === answers[0])) {
    fail(`${module.id}: semua jawaban kuis memakai indeks yang sama. Sebar posisi jawaban benar.`);
  }

  if (strict) {
    const avgWords = Math.round(
      module.lessons.reduce((sum, lesson) => sum + lesson.wordCount, 0) / module.lessons.length,
    );
    console.log(`${module.id}: ${module.lessons.length} pelajaran, rata-rata ${avgWords} kata.`);
  }
}

for (const lessonId of v3Lessons) {
  if (!lessonIds.has(lessonId)) fail(`requireV3 menunjuk pelajaran yang tidak ada: ${lessonId}.`);
}

if (curriculum.stats?.modules !== modules.length) {
  fail(`stats.modules ${curriculum.stats?.modules} tidak sama dengan ${modules.length}.`);
}
if (curriculum.stats?.lessons !== totalLessons) {
  fail(`stats.lessons ${curriculum.stats?.lessons} tidak sama dengan ${totalLessons}.`);
}

for (const warning of warnings) console.warn(`PERINGATAN: ${warning}`);

if (errors.length) {
  console.error(`\n${errors.length} masalah konten:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Konten valid: ${modules.length} modul, ${totalLessons} pelajaran, ${strictModules.size} modul ketat.`,
);

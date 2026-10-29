import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const contentDir = path.join(root, 'content');
const indexFile = path.join(contentDir, 'index.json');
const outputFile = path.join(root, 'data', 'curriculum.json');

const index = JSON.parse(fs.readFileSync(indexFile, 'utf8'));

const asArray = (value) => (Array.isArray(value) ? value : []);
const text = (value) => (typeof value === 'string' ? value.trim() : '');
const sourceTiers = new Set(['standard', 'official', 'education', 'secondary']);

function normalizeSources(value) {
  return asArray(value).map((item, sourceIndex) => {
    const source = {
      id: text(item?.id) || `source-${sourceIndex + 1}`,
      title: text(item?.title),
      publisher: text(item?.publisher),
      url: text(item?.url),
      tier: sourceTiers.has(item?.tier) ? item.tier : 'secondary',
      version: text(item?.version),
      accessedAt: text(item?.accessedAt),
      license: text(item?.license),
    };
    if (!source.id || !source.title || !source.url) {
      throw new Error(`Registry sumber tidak lengkap: ${source.id || `entri ${sourceIndex + 1}`}`);
    }
    return source;
  });
}

const sources = normalizeSources(index.sources);
const sourcesById = new Map(sources.map((source) => [source.id, source]));

function normalizeSections(lesson) {
  if (Array.isArray(lesson.sections) && lesson.sections.length > 0) {
    return lesson.sections.map((section, sectionIndex) => ({
      id: text(section.id) || `bagian-${sectionIndex + 1}`,
      title: text(section.title) || `Bagian ${sectionIndex + 1}`,
      body: asArray(section.body).map(text).filter(Boolean),
      code: section.code?.code
        ? {
            language: text(section.code.language) || text(lesson.codeLanguage) || 'javascript',
            code: String(section.code.code),
            output: text(section.code.output),
            explain: text(section.code.explain),
            annotations: asArray(section.code.annotations)
              .map((annotation) => ({
                line: Math.max(1, Number(annotation?.line) || 1),
                code: text(annotation?.code),
                note: text(annotation?.note),
              }))
              .filter((annotation) => annotation.code || annotation.note),
            lab: section.code.lab !== false,
          }
        : null,
      callouts: asArray(section.callouts)
        .map((callout) => ({
          tone: ['good', 'bad', 'warn'].includes(callout?.tone) ? callout.tone : 'good',
          title: text(callout?.title),
          body: text(callout?.body),
        }))
        .filter((callout) => callout.title || callout.body),
      checkpoint: section.checkpoint
        ? {
            prompt: text(section.checkpoint.prompt ?? section.checkpoint),
            success: text(section.checkpoint.success),
          }
        : null,
    }));
  }

  const concept = {
    id: 'konsep',
    title: 'Memahami konsepnya',
    body: [text(lesson.intro), text(lesson.explanation)].filter(Boolean),
    code: null,
    callouts: [
      lesson.bestPractice && { tone: 'good', title: 'Best practice', body: text(lesson.bestPractice) },
      lesson.commonMistake && { tone: 'bad', title: 'Kesalahan umum', body: text(lesson.commonMistake) },
    ].filter(Boolean),
    checkpoint: null,
  };

  const example = lesson.code
    ? {
        id: 'contoh',
        title: 'Contoh kode',
        body: ['Perhatikan input, proses, dan output. Ketik ulang, lalu ubah satu nilai.'],
        code: {
          language: text(lesson.codeLanguage) || 'javascript',
          code: String(lesson.code),
          output: '',
          explain: '',
        },
        callouts: [],
        checkpoint: null,
      }
    : null;

  return [concept, example].filter(Boolean);
}

function normalizePractice(lesson) {
  return asArray(lesson.practice).map((item, lessonIndex) => {
    if (typeof item === 'string') {
      return {
        id: `latihan-${lessonIndex + 1}`,
        title: `Latihan ${lessonIndex + 1}`,
        level: 'independent',
        task: item,
        steps: [],
        hint: '',
        hints: [],
        starterCode: '',
        expected: '',
        stretch: '',
        verification: null,
      };
    }
    return {
      id: text(item?.id) || `latihan-${lessonIndex + 1}`,
      title: text(item?.title) || `Latihan ${lessonIndex + 1}`,
      level: ['guided', 'independent', 'transfer'].includes(item?.level) ? item.level : 'independent',
      task: text(item?.task ?? item?.text),
      steps: asArray(item?.steps).map(text).filter(Boolean),
      hint: text(item?.hint),
      hints: normalizeStringList(item?.hints),
      starterCode: text(item?.starterCode),
      expected: text(item?.expected),
      stretch: text(item?.stretch),
      verification: normalizeVerification(item?.verification),
    };
  });
}

function normalizeVerification(value) {
  if (!value || typeof value !== 'object') return null;
  const mode = ['lab', 'browser', 'terminal', 'manual'].includes(value.mode)
    ? value.mode
    : 'manual';
  return {
    mode,
    command: text(value.command),
    expected: text(value.expected),
    evidence: text(value.evidence),
  };
}

function normalizeSyntax(value) {
  return asArray(value)
    .map((item) => ({
      token: text(item?.token),
      meaning: text(item?.meaning),
      readAs: text(item?.readAs),
      example: text(item?.example),
      output: text(item?.output),
      pitfall: text(item?.pitfall),
    }))
    .filter((item) => item.token || item.meaning);
}

function normalizeQuiz(lesson) {
  const rawQuestions = asArray(lesson.quiz?.questions);
  const questions = rawQuestions.length
    ? rawQuestions
    : lesson.quiz?.question
      ? [
          {
            id: 'q1',
            type: 'recall',
            question: lesson.quiz.question,
            options: lesson.quiz.options,
            answer: lesson.quiz.answer,
            explanation: lesson.quiz.explanation,
          },
        ]
      : [];

  return {
    questions: questions.map((question, questionIndex) => ({
      id: text(question?.id) || `q${questionIndex + 1}`,
      type: ['recall', 'code-reading', 'scenario'].includes(question?.type)
        ? question.type
        : 'recall',
      question: text(question?.question),
      options: asArray(question?.options).map(text).filter(Boolean),
      answer: Math.max(0, Number(question?.answer) || 0),
      explanation: text(question?.explanation),
    })),
  };
}

function normalizeStringList(value) {
  return asArray(value).map(text).filter(Boolean);
}

function normalizePrerequisites(value) {
  return asArray(value)
    .map((item) =>
      typeof item === 'string'
        ? { label: item, lessonId: '' }
        : { label: text(item?.label), lessonId: text(item?.lessonId) },
    )
    .filter((item) => item.label || item.lessonId);
}

function normalizeTerms(value) {
  return asArray(value)
    .map((item) =>
      typeof item === 'string'
        ? { term: item, definition: '' }
        : { term: text(item?.term), definition: text(item?.definition) },
    )
    .filter((item) => item.term);
}

function normalizeTroubleshooting(value) {
  return asArray(value)
    .map((item) => ({
      symptom: text(item?.symptom ?? item?.problem),
      cause: text(item?.cause),
      fix: text(item?.fix ?? item?.solution),
    }))
    .filter((item) => item.symptom || item.fix);
}

function normalizeResources(value, sourceRegistry) {
  return asArray(value)
    .map((item) => {
      const sourceId = text(item?.sourceId ?? item?.id);
      const registrySource = sourceId ? sourceRegistry.get(sourceId) : null;
      if (sourceId && !registrySource) {
        throw new Error(`Sumber tidak ditemukan di registry: ${sourceId}`);
      }
      return {
        sourceId,
        title: registrySource?.title ?? text(item?.title),
        publisher: registrySource?.publisher ?? text(item?.publisher),
        url: registrySource?.url ?? text(item?.url),
        note: text(item?.note),
        tier: registrySource?.tier ?? text(item?.tier),
        version: registrySource?.version ?? text(item?.version),
        accessedAt: registrySource?.accessedAt ?? text(item?.accessedAt),
        license: registrySource?.license ?? text(item?.license),
      };
    })
    .filter((item) => item.title && item.url);
}

function proseParts(lesson) {
  const parts = [
    lesson.title,
    lesson.outcome,
    ...lesson.objectives,
    ...lesson.terms.flatMap((term) => [term.term, term.definition]),
    ...lesson.syntax.flatMap((item) => [
      item.token,
      item.meaning,
      item.readAs,
      item.example,
      item.output,
      item.pitfall,
    ]),
    ...lesson.conventions,
    lesson.next,
    ...lesson.sections.flatMap((section) => [
      section.title,
      ...section.body,
      ...section.callouts.flatMap((callout) => [callout.title, callout.body]),
      section.checkpoint?.prompt,
      section.checkpoint?.success,
      section.code?.explain,
      ...(section.code?.annotations ?? []).map((annotation) => annotation.note),
    ]),
    ...lesson.practice.flatMap((item) => [
      item.title,
      item.task,
      ...item.steps,
      item.hint,
      ...item.hints,
      item.expected,
      item.stretch,
      item.verification?.command,
      item.verification?.expected,
      item.verification?.evidence,
    ]),
    lesson.verification?.command,
    lesson.verification?.expected,
    lesson.verification?.evidence,
    ...lesson.troubleshooting.flatMap((item) => [item.symptom, item.cause, item.fix]),
    ...lesson.quiz.questions.flatMap((question) => [
      question.question,
      ...question.options,
      question.explanation,
    ]),
    ...lesson.resources.flatMap((item) => [item.title, item.note]),
    ...lesson.summary,
  ];
  return parts.filter(Boolean);
}

function normalizeLesson(lesson, sourceRegistry) {
  const normalized = {
    id: text(lesson.id),
    title: text(lesson.title),
    minutes: Math.max(1, Number(lesson.minutes) || 45),
    level: text(lesson.level) || 'Dasar',
    depth: ['fondasi', 'integrasi', 'capstone'].includes(lesson.depth) ? lesson.depth : 'integrasi',
    outcome: text(lesson.outcome),
    codeLanguage: text(lesson.codeLanguage) || 'javascript',
    objectives: normalizeStringList(lesson.objectives),
    prerequisites: normalizePrerequisites(lesson.prerequisites),
    terms: normalizeTerms(lesson.terms),
    syntax: normalizeSyntax(lesson.syntax),
    conventions: normalizeStringList(lesson.conventions),
    next: text(lesson.next),
    sections: normalizeSections(lesson),
    practice: normalizePractice(lesson),
    verification: normalizeVerification(lesson.verification),
    troubleshooting: normalizeTroubleshooting(lesson.troubleshooting),
    quiz: normalizeQuiz(lesson),
    resources: normalizeResources(lesson.resources, sourceRegistry),
    summary: normalizeStringList(lesson.summary),
    legacy: !Array.isArray(lesson.sections) || lesson.sections.length === 0,
  };

  const primarySectionCode = normalized.sections.find((section) => section.code)?.code;
  normalized.code = text(lesson.code) || primarySectionCode?.code || '';
  normalized.codeLanguage = text(lesson.codeLanguage) || primarySectionCode?.language || 'javascript';
  normalized.wordCount = proseParts(normalized)
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length;
  normalized.schema =
    Number(lesson.schema) === 3.1
      ? 3.1
      : normalized.outcome || normalized.syntax.length || normalized.verification
        ? 3
        : 2;
  return normalized;
}

function readModule(entry) {
  if (entry.dir) {
    const dir = path.join(contentDir, entry.dir);
    const metaFile = path.join(dir, 'module.json');
    if (!fs.existsSync(metaFile)) throw new Error(`Metadata modul tidak ditemukan: ${entry.dir}`);
    const module = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
    const lessonFiles = fs
      .readdirSync(dir)
      .filter((name) => /^lesson-\d+.*\.json$/.test(name))
      .sort();
    module.lessons = lessonFiles.map((name) =>
      JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')),
    );
    return module;
  }

  const file = path.join(contentDir, entry.file);
  if (!fs.existsSync(file)) throw new Error(`Berkas modul tidak ditemukan: ${entry.file}`);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const modules = index.modules.map((entry) => {
  const module = readModule(entry);
  const lessons = asArray(module.lessons).map((lesson) => normalizeLesson(lesson, sourcesById));
  return {
    ...module,
    id: text(module.id) || entry.id,
    lessons,
    lessonCount: lessons.length,
    wordCount: lessons.reduce((sum, lesson) => sum + lesson.wordCount, 0),
  };
});

const curriculum = {
  appName: index.appName,
  version: index.version,
  updated: index.updated,
  summary: index.summary,
  disclaimer: index.disclaimer,
  modules,
  roadmap: index.roadmap,
  tools: index.tools,
  glossary: index.glossary,
  projects: index.projects,
  sources,
  contentPolicy: index.contentPolicy,
  sourcePolicy: index.sourcePolicy,
  target: index.target,
  stats: {
    modules: modules.length,
    lessons: modules.reduce((sum, module) => sum + module.lessons.length, 0),
    words: modules.reduce((sum, module) => sum + module.wordCount, 0),
    minutes: modules.reduce(
      (sum, module) => sum + module.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.minutes, 0),
      0,
    ),
  },
};

fs.mkdirSync(path.dirname(outputFile), { recursive: true });
fs.writeFileSync(outputFile, `${JSON.stringify(curriculum, null, 2)}\n`, 'utf8');
console.log(
  `Konten dibangun: ${curriculum.stats.modules} modul, ${curriculum.stats.lessons} pelajaran, ${curriculum.stats.words} kata.`,
);
